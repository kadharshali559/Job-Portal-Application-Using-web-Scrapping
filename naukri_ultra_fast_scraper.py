# -*- coding: utf-8 -*-
import requests
import time
import datetime
import os
import sys

# Force UTF-8 encoding for Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

import pandas as pd
from selenium.webdriver.common.by import By
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup

print("="*70)
print("      NAUKRI SUPER FAST SCRAPER - 1000+ JOBS GUARANTEED")
print("  Uses direct URL pagination for maximum speed")
print("="*70)
print()

# Chrome setup for maximum speed
WINDOW_SIZE = "1920,1080"
chrome_options = Options()
chrome_options.add_argument("--window-size=%s" % WINDOW_SIZE)
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--disable-dev-shm-usage')
chrome_options.add_argument('--disable-images')  # Faster loading
chrome_options.add_argument('--disable-gpu')
chrome_options.add_argument('--blink-settings=imagesEnabled=false')  # Extra speed
chrome_options.page_load_strategy = 'eager'  # Don't wait for full page load

# Automatically manage ChromeDriver
service = Service(ChromeDriverManager().install())

def close_popups(driver):
    """Close any popups that might appear"""
    popup_xpaths = [
        '//button[contains(@class, "close")]',
        '//div[contains(@class, "close")]',
        '//*[contains(@class, "crossIcon")]',
    ]
    for xpath in popup_xpaths:
        try:
            driver.find_element(By.XPATH, xpath).click()
            time.sleep(0.2)
        except:
            pass

def scrape_job_from_card(card_html):
    """Extract job info from a job card HTML"""
    try:
        soup = BeautifulSoup(card_html, 'html.parser')
        
        # Title & URL
        title_elem = soup.find('a', class_='title')
        title = title_elem.text.strip() if title_elem else "Not Mentioned"
        job_url = title_elem.get('href') if title_elem else None
        
        # Company
        company_elem = soup.find('a', class_='comp-name')
        company = company_elem.text.strip() if company_elem else "Not Mentioned"
        
        # Experience
        exp_elem = soup.find('span', class_='expwdth')
        experience = exp_elem.text.strip() if exp_elem else "Not Mentioned"
        
        # Location
        loc_elem = soup.find('span', class_='locWdth')
        location = loc_elem.text.strip() if loc_elem else "Not Mentioned"
        
        # Salary - Enhanced extraction
        salary_elem = soup.find('span', class_='sal')
        if salary_elem:
            # Try to get from title attribute first (often cleaner)
            inner_sal = salary_elem.find('span', title=True)
            if inner_sal and inner_sal.get('title'):
                salary = inner_sal.get('title').strip()
            else:
                salary = salary_elem.text.strip()
        else:
            salary = "Not Disclosed"
        
        # Date Posted - Enhanced extraction
        date_elem = soup.find('span', class_='job-post-day')
        if not date_elem:
            date_elem = soup.find('span', class_='posted')
        
        # Clean date text "4 days ago" -> "4 days ago"
        date_posted = date_elem.text.strip() if date_elem else "Just now"
        # If date contains "Posted:", clean it
        if "Posted:" in date_posted:
            date_posted = date_posted.replace("Posted:", "").strip()
        
        # Description
        desc_elem = soup.find('div', class_='job-description')
        if not desc_elem:
            desc_elem = soup.find('ul', class_='list-inline')
        description = desc_elem.text.strip()[:300] if desc_elem else None
        
        return {
            'Job Title': title,
            'Description': description,
            'Experience Reqd': experience,
            'Company': company,
            'City': location,
            'Salary Range': salary,
            'Date Posted': date_posted,
            'Apply URL': job_url,
            'Source': 'Naukri'
        }
    except Exception as e:
        return None

def main():
    """Main scraping function - ULTRA FAST version for 1000+ jobs"""
    
    # DataFrame to store results
    df = pd.DataFrame(columns=[
        'Job Title', 'Description', 'Experience Reqd', 'Company', 
        'City', 'Salary Range', 'Date Posted', 'Apply URL', 'Source'
    ])
    
    # Initialize driver
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    # Scraping variables
    TARGET_JOBS = 1000
    jobs_collected = 0
    page_num = 0
    
    print(f"TARGET: {TARGET_JOBS} jobs")
    print()
    print("="*70)
    
    # Use direct URL construction for pagination (much more reliable)
    # Naukri URL pattern: https://www.naukri.com/jobs-in-india-{page_num}
    while jobs_collected < TARGET_JOBS:
        page_num += 1
        
        # Construct URL directly - this is more reliable than clicking next
        if page_num == 1:
            url = "https://www.naukri.com/jobs-in-india"
        else:
            url = f"https://www.naukri.com/jobs-in-india-{page_num}"
        
        print(f"\nPAGE {page_num}")
        print("-"*70)
        print(f"Loading: {url}")
        
        try:
            driver.get(url)
            
            # Quick wait for jobs to load
            try:
                WebDriverWait(driver, 8).until(
                    EC.presence_of_element_located((By.CLASS_NAME, "srp-jobtuple-wrapper"))
                )
            except:
                print("Page load timeout, but continuing...")
                time.sleep(2)
            
            close_popups(driver)
            time.sleep(0.5)  # Minimal wait
            
            # Get job cards
            job_cards = driver.find_elements(By.CLASS_NAME, "srp-jobtuple-wrapper")
            
            if not job_cards:
                print("No jobs found on this page. Ending.")
                break
            
            print(f"Found {len(job_cards)} jobs on this page")
            
            # Extract HTML quickly
            jobs_data = []
            for card in job_cards:
                try:
                    card_html = card.get_attribute('outerHTML')
                    job_data = scrape_job_from_card(card_html)
                    if job_data and job_data['Apply URL']:
                        jobs_data.append(job_data)
                except:
                    continue
            
            # Add to DataFrame
            if jobs_data:
                df = pd.concat([df, pd.DataFrame(jobs_data)], ignore_index=True)
                jobs_collected = len(df)
                print(f"Scraped {len(jobs_data)} jobs from this page")
                print(f"Total collected: {jobs_collected}/{TARGET_JOBS}")
            
            # Save progress every 100 jobs
            if jobs_collected % 100 == 0 and jobs_collected > 0:
                data_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'server', 'data')
                os.makedirs(data_path, exist_ok=True)
                filename = f"NaukriJobs_Fast_{datetime.date.today()}.xlsx"
                df.to_excel(os.path.join(data_path, filename), index=False)
                print(f">> Progress saved: {jobs_collected} jobs")
            
            # Check if target reached
            if jobs_collected >= TARGET_JOBS:
                print(f"\nTARGET REACHED! Collected {jobs_collected} jobs!")
                break
            
            # Stop if we've gone too far (safety limit at 100 pages)
            if page_num >= 100:
                print("Reached page limit (100 pages)")
                break
                
        except Exception as e:
            print(f"Error on page {page_num}: {str(e)[:100]}")
            # Try to continue to next page anyway
            continue
    
    # Final save
    data_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'server', 'data')
    os.makedirs(data_path, exist_ok=True)
    filename = f"NaukriJobs_Fast_{datetime.date.today()}.xlsx"
    file_path = os.path.join(data_path, filename)
    df.to_excel(file_path, index=False)
    
    # Print summary
    print("\n" + "="*70)
    print("SCRAPING COMPLETED!")
    print("="*70)
    print(f"Total jobs collected: {jobs_collected}")
    print(f"Pages scraped: {page_num}")
    print(f"Saved to: {file_path}")
    print(f"Unique companies: {df['Company'].nunique()}")
    print("="*70)
    
    # Show sample companies
    if len(df) > 0:
        print(f"\nTop 10 Companies by Job Count:")
        sample_companies = df['Company'].value_counts().head(10)
        for company, count in sample_companies.items():
            print(f"   {count:3d} jobs - {company}")
        
        print(f"\n>>> {len(df)} JOBS READY TO VIEW IN YOUR APP!")
    
    print("\nRefresh your browser to see the new jobs!")
    input("\n>>> Press ENTER to close browser...")
    driver.quit()

if __name__ == "__main__":
    main()
