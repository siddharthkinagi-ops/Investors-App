#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
from typing import Dict, List, Any

class InvestorDatabaseTester:
    def __init__(self, base_url="https://vc-finder-5.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_investors = []
        self.test_results = []

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, data: Dict = None, params: Dict = None) -> tuple:
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            response_data = {}
            
            try:
                response_data = response.json() if response.content else {}
            except:
                response_data = {"raw_response": response.text}

            if success:
                self.log_test(name, True)
                print(f"   Status: {response.status_code}")
                if response_data and method == 'GET':
                    if isinstance(response_data, list):
                        print(f"   Response: {len(response_data)} items")
                    else:
                        print(f"   Response keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'Non-dict response'}")
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                if response_data:
                    error_msg += f" - {response_data}"
                self.log_test(name, False, error_msg)

            return success, response_data, response.status_code

        except Exception as e:
            error_msg = f"Request failed: {str(e)}"
            self.log_test(name, False, error_msg)
            return False, {}, 0

    def test_root_endpoint(self):
        """Test API root endpoint"""
        return self.run_test("API Root", "GET", "", 200)

    def test_get_investors_empty(self):
        """Test getting investors when database is empty"""
        return self.run_test("Get Investors (Empty)", "GET", "investors", 200)

    def test_get_filter_options(self):
        """Test getting filter options"""
        return self.run_test("Get Filter Options", "GET", "investors/filters", 200)

    def test_get_new_investors(self):
        """Test getting new investors"""
        return self.run_test("Get New Investors", "GET", "investors/new", 200)

    def test_create_investor(self):
        """Test creating a new investor"""
        test_investor = {
            "name": "John Doe",
            "institution": "Test Ventures",
            "title": "Managing Partner",
            "cheque_size": "$1M-$5M",
            "geographies": ["India", "USA"],
            "sectors": ["Fintech", "SaaS"],
            "stage": "Series A",
            "shareholding": "10-15%",
            "email": "john@testventures.com",
            "website": "https://testventures.com",
            "source": "Test Source",
            "notes": "Test investor for API testing"
        }
        
        success, response_data, status_code = self.run_test(
            "Create Investor", "POST", "investors", 201, test_investor
        )
        
        if success and response_data.get('id'):
            self.created_investors.append(response_data['id'])
            print(f"   Created investor ID: {response_data['id']}")
        
        return success, response_data, status_code

    def test_get_investors_with_data(self):
        """Test getting investors after creating one"""
        success, response_data, status_code = self.run_test("Get Investors (With Data)", "GET", "investors", 200)
        
        if success and isinstance(response_data, list) and len(response_data) > 0:
            print(f"   Found {len(response_data)} investors")
            investor = response_data[0]
            print(f"   First investor: {investor.get('name', 'Unknown')}")
        
        return success, response_data, status_code

    def test_search_investors(self):
        """Test searching investors"""
        params = {"search": "John"}
        return self.run_test("Search Investors", "GET", "investors", 200, params=params)

    def test_filter_investors(self):
        """Test filtering investors by geography"""
        params = {"geography": "India"}
        return self.run_test("Filter by Geography", "GET", "investors", 200, params=params)

    def test_update_investor(self):
        """Test updating an investor"""
        if not self.created_investors:
            self.log_test("Update Investor", False, "No investor ID available")
            return False, {}, 0
        
        investor_id = self.created_investors[0]
        update_data = {
            "title": "Senior Partner",
            "cheque_size": "$2M-$10M"
        }
        
        return self.run_test(
            "Update Investor", "PUT", f"investors/{investor_id}", 200, update_data
        )

    def test_delete_investor(self):
        """Test deleting an investor"""
        if not self.created_investors:
            self.log_test("Delete Investor", False, "No investor ID available")
            return False, {}, 0
        
        investor_id = self.created_investors[0]
        success, response_data, status_code = self.run_test(
            "Delete Investor", "DELETE", f"investors/{investor_id}", 200
        )
        
        if success:
            self.created_investors.remove(investor_id)
        
        return success, response_data, status_code

    def test_ai_extraction(self):
        """Test AI extraction functionality"""
        test_content = """
        Acme Ventures, led by John Smith (Managing Partner), announced a $50M fund focused on B2B SaaS startups in India and Southeast Asia. 
        The fund typically invests $500K-$2M at Seed and Series A stages, taking 10-15% equity. 
        Contact: john@acmeventures.com, Website: https://acmeventures.com
        
        Another investor, Jane Wilson from Beta Capital (Partner), focuses on Fintech and HealthTech in the US market.
        She invests $1M-$5M in Series A and B rounds. Email: jane@betacapital.com
        """
        
        extract_data = {"content": test_content}
        success, response_data, status_code = self.run_test(
            "AI Extract Investors", "POST", "extract-investors", 200, extract_data
        )
        
        if success and response_data.get('investors'):
            extracted_count = len(response_data['investors'])
            print(f"   Extracted {extracted_count} investors")
            for investor in response_data['investors']:
                if investor.get('id'):
                    self.created_investors.append(investor['id'])
        
        return success, response_data, status_code

    def test_export_excel(self):
        """Test Excel export functionality"""
        success, response_data, status_code = self.run_test(
            "Export Excel", "GET", "investors/export", 200
        )
        return success, response_data, status_code

    def cleanup_created_investors(self):
        """Clean up any investors created during testing"""
        print(f"\n🧹 Cleaning up {len(self.created_investors)} created investors...")
        for investor_id in self.created_investors[:]:
            try:
                response = requests.delete(f"{self.base_url}/api/investors/{investor_id}")
                if response.status_code == 200:
                    print(f"   Deleted investor {investor_id}")
                    self.created_investors.remove(investor_id)
                else:
                    print(f"   Failed to delete investor {investor_id}")
            except Exception as e:
                print(f"   Error deleting investor {investor_id}: {e}")

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Investor Database API Tests")
        print(f"   Base URL: {self.base_url}")
        print("=" * 60)

        # Test sequence
        test_methods = [
            self.test_root_endpoint,
            self.test_get_investors_empty,
            self.test_get_filter_options,
            self.test_get_new_investors,
            self.test_create_investor,
            self.test_get_investors_with_data,
            self.test_search_investors,
            self.test_filter_investors,
            self.test_update_investor,
            self.test_ai_extraction,
            self.test_export_excel,
            self.test_delete_investor,
        ]

        for test_method in test_methods:
            try:
                test_method()
            except Exception as e:
                print(f"❌ {test_method.__name__} - EXCEPTION: {str(e)}")
                self.tests_run += 1

        # Cleanup
        self.cleanup_created_investors()

        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print(f"   Tests Run: {self.tests_run}")
        print(f"   Tests Passed: {self.tests_passed}")
        print(f"   Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        # Print failed tests
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = InvestorDatabaseTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())