import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException
from webdriver_manager.chrome import ChromeDriverManager

# --- Configuration ---
OUTPUT_DIR = "html"

# A dictionary of common departments for the user menu
COMMON_DEPARTMENTS = {
    "1": "Judaism",
    "83": "Math",
    "84": "Computer Science"
}

def get_user_url():
    """Prompts the user for the target URL. Fails if empty."""
    url = input("Enter the target URL (e.g., https://courses.SOMETHING.ac.il/): ").strip()
    if not url:
        print("❌ ERROR: URL cannot be empty. Exiting.")
        exit(1)
    return url


def get_user_departments():
    """Displays a menu and prompts the user to select department IDs."""
    print("\n--- Bar-Ilan Course Scraper ---")
    print("Common Department Codes:")
    for code, name in COMMON_DEPARTMENTS.items():
        print(f"  [{code}] - {name}")
    
    print("\nNote: You can enter any valid department ID, even if it is not on this list.")
    user_input = input(f"Enter department IDs separated by commas (e.g., {', '.join([f'{id}-{name}' for id, name in COMMON_DEPARTMENTS.items()])}): ")
    
    # Clean up the input: split by comma, remove whitespace, and ignore empty strings
    departments = [dept.strip() for dept in user_input.split(",") if dept.strip()]
    
    if not departments:
        print("No departments entered. Defaulting to Computer Science (84).")
        return ["84"]
        
    return departments


def setup_driver():
    """Initializes and returns a Selenium Chrome WebDriver."""
    chrome_options = Options()
    # Start maximized so the user can easily see and solve CAPTCHAs
    chrome_options.add_argument("--start-maximized")
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    return driver


def save_html(content, folder, filename):
    """Saves HTML content to the specified folder."""
    os.makedirs(folder, exist_ok=True)
    filepath = os.path.join(folder, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  -> Saved: {filename}")


def scrape_department(driver, dept_value, output_dir, url):
    """Handles the scraping logic for a single department."""
    # We set a 20-second wait. If a CAPTCHA appears, the user has 20 seconds to solve it 
    # before the script throws a TimeoutException.
    wait = WebDriverWait(driver, 20)
    
    try:
        driver.get(url)

        # 1. Select the department
        dept_select = Select(wait.until(EC.presence_of_element_located((By.ID, "ContentPlaceHolder1_cmbDepartments"))))
        dept_select.select_by_value(dept_value)

        # 2. Click the Search button
        submit_button = driver.find_element(By.ID, "ContentPlaceHolder1_btnSearch")
        submit_button.click()

        page_number = 1

        while True:
            # Wait for the table to render. This is usually where the script gets stuck if a CAPTCHA blocks the page.
            wait.until(EC.presence_of_element_located((By.ID, "ContentPlaceHolder1_gvLessons")))
            time.sleep(1.5)  # Buffer for dynamic JS to finish rendering

            # Save the page source
            page_html = driver.page_source
            filename = f"department_{dept_value}_page_{page_number}.html"
            save_html(page_html, output_dir, filename)

            # 3. Handle Pagination
            table_elem = driver.find_element(By.ID, "ContentPlaceHolder1_gvLessons")
            table_rows = table_elem.find_elements(By.TAG_NAME, "tr")
            last_row = table_rows[-1]
            tds = last_row.find_elements(By.TAG_NAME, "td")

            next_link = None
            
            # Locate the current page number and click the link directly next to it
            for i in range(len(tds) - 1):
                span = tds[i].find_elements(By.TAG_NAME, "span")
                if span and span[0].text.strip() == str(page_number):
                    next_td = tds[i + 1]
                    a_tags = next_td.find_elements(By.TAG_NAME, "a")
                    if a_tags:
                        next_link = a_tags[0]
                        break

            if next_link:
                page_number += 1
                next_link.click()
                time.sleep(1) # Buffer before the wait.until triggers again
            else:
                print(f"✓ Finished department {dept_value}. Total pages scraped: {page_number}")
                break 

    except TimeoutException:
        print("\n❌ TIMEOUT ERROR!")
        print("The page took too long to load, or the expected table didn't appear.")
        print("Common causes:")
        print("  1. A CAPTCHA popped up and blocked the page.")
        print("  2. The website is experiencing heavy traffic and loading slowly.")
        print("  3. The department ID might be invalid.")
        print("\nFix: Keep an eye on the browser. If you see a CAPTCHA, solve it manually.")
        print("If the script crashes before you finish, just run it again!\n")
    except WebDriverException as e:
        print(f"\n❌ BROWSER ERROR: The browser was closed or lost connection. Details: {e}")
    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR while scraping department {dept_value}: {e}")


def main():
    # Show user instructions regarding CAPTCHAs before starting
    print("==================================================")
    print("⚠️  CAPTCHA WARNING:")
    print("If a CAPTCHA appears in the browser window, you will have about 20 seconds")
    print("to solve it manually before the script times out. If it times out, don't")
    print("worry—just run the script again.")
    print("==================================================\n")

    target_url = get_user_url()
    departments_to_scrape = get_user_departments()
    
    print("\nStarting browser...")
    driver = setup_driver()
    
    try:
        for dept in departments_to_scrape:
            print(f"\n--- Scraping Department ID: {dept} ---")
            scrape_department(driver, dept, OUTPUT_DIR, target_url)
    finally:
        driver.quit()
        print("\nBrowser closed. Scraping session ended.")


if __name__ == "__main__":
    main()