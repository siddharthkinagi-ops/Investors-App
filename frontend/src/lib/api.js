//api.js

import { db } from './firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import * as XLSX from 'xlsx';

const INVESTORS_COLLECTION = 'investors';
const BACKEND_URL = 'http://72.61.248.3:8000';

// Helper to convert Firestore timestamp to ISO string
const convertTimestamp = (timestamp) => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
};

// Helper to serialize investor data from Firestore
const serializeInvestor = (docSnap) => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    created_at: convertTimestamp(data.created_at),
  };
};

const normalizeHeader = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s/\\\-().]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

const normalizeRowKeys = (row) => {
  const normalized = {};

  Object.entries(row || {}).forEach(([key, value]) => {
    normalized[normalizeHeader(key)] = value;
  });

  return normalized;
};

const getRowValue = (row, possibleKeys = []) => {
  for (const key of possibleKeys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }
  return '';
};

const parseListValue = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || '').trim())
      .filter(Boolean);
  }

  if (value === undefined || value === null || value === '') {
    return [];
  }

  return String(value)
    .split(/[,;|\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseDateToTimestamp = (value) => {
  if (!value) return Timestamp.now();

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return Timestamp.fromDate(value);
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return Timestamp.fromDate(parsed);
  }

  return Timestamp.now();
};

const buildInvestorFromImportedRow = (rawRow) => {
  const row = normalizeRowKeys(rawRow);

  return {
    name: String(getRowValue(row, ['name', 'investor_name'])).trim(),
    institution: String(
      getRowValue(row, [
        'institution_fund',
        'institution',
        'fund',
        'firm',
        'investor_firm',
        'company',
      ])
    ).trim(),
    title: String(getRowValue(row, ['title', 'designation', 'role'])).trim(),
    cheque_size: String(
      getRowValue(row, [
        'cheque_size',
        'check_size',
        'ticket_size',
        'cheque',
        'fund_size',
      ])
    ).trim(),
    geographies: parseListValue(
      getRowValue(row, ['geographies', 'geography', 'regions', 'region'])
    ),
    sectors: parseListValue(
      getRowValue(row, ['sectors', 'sector', 'focus_sectors', 'focus_sector'])
    ),
    stage: String(getRowValue(row, ['stage', 'stages'])).trim(),
    shareholding: String(getRowValue(row, ['shareholding'])).trim(),
    email: String(getRowValue(row, ['email', 'email_address', 'e_mail'])).trim(),
    website: String(getRowValue(row, ['website', 'url', 'site', 'linkedin'])).trim(),
    source: String(getRowValue(row, ['source', 'source_url', 'reference'])).trim(),
    notes: String(
      getRowValue(row, ['notes', 'remarks', 'comments', 'comment', 'description'])
    ).trim(),
    created_at: parseDateToTimestamp(
      getRowValue(row, ['added_on', 'created_at', 'date_added', 'added_date'])
    ),
    is_new: true,
  };
};

const hasMeaningfulInvestorData = (investor) => {
  return Boolean(
    investor.name ||
      investor.institution ||
      investor.title ||
      investor.email ||
      investor.website ||
      investor.source ||
      investor.notes ||
      investor.geographies.length ||
      investor.sectors.length ||
      investor.stage ||
      investor.cheque_size
  );
};

// Investor API functions using Firebase
export const investorApi = {
  // Get all investors with optional filters
  getAll: async (filters = {}) => {
    try {
      const q = collection(db, INVESTORS_COLLECTION);

      // We'll filter in memory for complex queries since Firestore has limitations
      const snapshot = await getDocs(query(q, orderBy('created_at', 'desc')));
      let investors = snapshot.docs.map(serializeInvestor);

      // Apply filters in memory
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        investors = investors.filter(inv =>
          inv.name?.toLowerCase().includes(searchLower) ||
          inv.institution?.toLowerCase().includes(searchLower) ||
          inv.title?.toLowerCase().includes(searchLower) ||
          inv.email?.toLowerCase().includes(searchLower)
        );
      }

      if (filters.geography) {
        investors = investors.filter(inv =>
          inv.geographies?.includes(filters.geography)
        );
      }

      if (filters.sector) {
        investors = investors.filter(inv =>
          inv.sectors?.includes(filters.sector)
        );
      }

      if (filters.stage) {
        investors = investors.filter(inv => inv.stage === filters.stage);
      }

      if (filters.cheque_size) {
        investors = investors.filter(inv => inv.cheque_size === filters.cheque_size);
      }

      return investors;
    } catch (error) {
      console.error('Error getting investors:', error);
      throw error;
    }
  },

  // Get new investors (last 24 hours)
  getNew: async () => {
    try {
      const cutoff = new Date();
      cutoff.setHours(cutoff.getHours() - 24);

      const q = query(
        collection(db, INVESTORS_COLLECTION),
        where('created_at', '>=', Timestamp.fromDate(cutoff)),
        orderBy('created_at', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(serializeInvestor);
    } catch (error) {
      console.error('Error getting new investors:', error);
      // Fallback: get all and filter
      const all = await investorApi.getAll();
      const cutoff = new Date();
      cutoff.setHours(cutoff.getHours() - 24);
      return all.filter(inv => new Date(inv.created_at) >= cutoff);
    }
  },

  // Get filter options
  getFilters: async () => {
    try {
      const snapshot = await getDocs(collection(db, INVESTORS_COLLECTION));
      const investors = snapshot.docs.map(doc => doc.data());

      const geographies = new Set();
      const sectors = new Set();
      const stages = new Set();
      const cheque_sizes = new Set();

      investors.forEach(inv => {
        inv.geographies?.forEach(g => g && geographies.add(g));
        inv.sectors?.forEach(s => s && sectors.add(s));
        if (inv.stage) stages.add(inv.stage);
        if (inv.cheque_size) cheque_sizes.add(inv.cheque_size);
      });

      return {
        geographies: Array.from(geographies).sort(),
        sectors: Array.from(sectors).sort(),
        stages: Array.from(stages).sort(),
        cheque_sizes: Array.from(cheque_sizes).sort(),
      };
    } catch (error) {
      console.error('Error getting filters:', error);
      return { geographies: [], sectors: [], stages: [], cheque_sizes: [] };
    }
  },

  // Create new investor
  create: async (investor) => {
    try {
      const docData = {
        ...investor,
        geographies: investor.geographies || [],
        sectors: investor.sectors || [],
        created_at: Timestamp.now(),
        is_new: true,
      };

      const docRef = await addDoc(collection(db, INVESTORS_COLLECTION), docData);

      return {
        id: docRef.id,
        ...docData,
        created_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error creating investor:', error);
      throw error;
    }
  },

  // Update investor
  update: async (id, investor) => {
    try {
      const docRef = doc(db, INVESTORS_COLLECTION, id);
      const updateData = { ...investor };
      delete updateData.id;
      delete updateData.created_at;

      await updateDoc(docRef, updateData);

      const updatedDoc = await getDoc(docRef);
      return serializeInvestor(updatedDoc);
    } catch (error) {
      console.error('Error updating investor:', error);
      throw error;
    }
  },

  // Delete investor
  delete: async (id) => {
    try {
      await deleteDoc(doc(db, INVESTORS_COLLECTION, id));
      return { message: 'Investor deleted successfully' };
    } catch (error) {
      console.error('Error deleting investor:', error);
      throw error;
    }
  },

  // Import investors from CSV/Excel file and store in Firebase
  importExcel: async (file) => {
    try {
      if (!file) {
        throw new Error('Please select a file to import');
      }

      const fileName = file.name?.toLowerCase() || '';
      const isValidFile =
        fileName.endsWith('.xlsx') ||
        fileName.endsWith('.xls') ||
        fileName.endsWith('.csv');

      if (!isValidFile) {
        throw new Error('Only .xlsx, .xls, and .csv files are supported');
      }

      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, {
        type: 'array',
        cellDates: true,
      });

      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        throw new Error('No sheet found in the uploaded file');
      }

      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, {
        defval: '',
        raw: false,
      });

      if (!rows.length) {
        throw new Error('The uploaded file is empty');
      }

      const investorsToImport = rows
        .map(buildInvestorFromImportedRow)
        .filter(hasMeaningfulInvestorData);

      if (!investorsToImport.length) {
        throw new Error('No valid investor records found in the file');
      }

      const batchSize = 400;
      for (let i = 0; i < investorsToImport.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = investorsToImport.slice(i, i + batchSize);

        chunk.forEach((investor) => {
          const newDocRef = doc(collection(db, INVESTORS_COLLECTION));
          batch.set(newDocRef, investor);
        });

        await batch.commit();
      }

      return {
        imported: investorsToImport.length,
      };
    } catch (error) {
      console.error('Error importing Excel/CSV:', error);
      throw error;
    }
  },

  // Extract investor from content using backend AI endpoint
  extract: async (payload) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/extract-investor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          typeof payload === 'string'
            ? { content: payload, sourceUrl: '' }
            : payload
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'AI extraction failed');
      }

      return data;
    } catch (error) {
      console.error('Error extracting investor:', error);
      throw error;
    }
  },

  // Discover investors automatically using backend AI search
  discover: async (payload) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/discover-investors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sector: payload?.sector || '',
          geography: payload?.geography || '',
          stage: payload?.stage || '',
          count: Number(payload?.count || 5),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Investor discovery failed');
      }

      return data;
    } catch (error) {
      console.error('Error discovering investors:', error);
      throw error;
    }
  },

  // Export to Excel (client-side)
  exportExcel: async (filters = {}) => {
    try {
      const investors = await investorApi.getAll(filters);

      const data = investors.map(inv => ({
        Name: inv.name || "",
        "Institution/Fund": inv.institution || "",
        Title: inv.title || "",
        "Cheque Size": inv.cheque_size || "",
        Geographies: (inv.geographies || []).join(", "),
        Sectors: (inv.sectors || []).join(", "),
        Stage: inv.stage || "",
        Shareholding: inv.shareholding || "",
        Email: inv.email || "",
        Website: inv.website || "",
        Source: inv.source || "",
        Notes: inv.notes || "",
        "Added On": inv.created_at || "",
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Investors");

      XLSX.writeFile(wb, "investor_database.xlsx");
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw error;
    }
  },
};