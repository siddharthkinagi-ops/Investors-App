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
} from 'firebase/firestore';
import * as XLSX from 'xlsx';

const INVESTORS_COLLECTION = 'investors';

// Helper to convert Firestore timestamp to ISO string
const convertTimestamp = (timestamp) => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
};

// Helper to serialize investor data from Firestore
const serializeInvestor = (doc) => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    created_at: convertTimestamp(data.created_at),
  };
};

// Investor API functions using Firebase
export const investorApi = {
  // Get all investors with optional filters
  getAll: async (filters = {}) => {
    try {
      let q = collection(db, INVESTORS_COLLECTION);
      const constraints = [];
      
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

  // Extract investors from content (client-side placeholder)
  // Note: For production, use Firebase Cloud Functions for API key security
  extract: async (content) => {
    // This is a placeholder - AI extraction requires a secure backend
    // You can implement this via Firebase Cloud Functions
    throw new Error('AI extraction requires Firebase Cloud Functions setup. Please add investors manually for now.');
  },

  // Export to Excel (client-side)
  exportExcel: async (filters = {}) => {
    try {
      const investors = await investorApi.getAll(filters);
      
      const data = investors.map(inv => ({
        "Name": inv.name || "",
        "Institution/Fund": inv.institution || "",
        "Title": inv.title || "",
        "Cheque Size": inv.cheque_size || "",
        "Geographies": (inv.geographies || []).join(", "),
        "Sectors": (inv.sectors || []).join(", "),
        "Stage": inv.stage || "",
        "Shareholding": inv.shareholding || "",
        "Email": inv.email || "",
        "Website": inv.website || "",
        "Source": inv.source || "",
        "Notes": inv.notes || "",
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
