import sys
import time
import json
import os
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:8081"
REPORT_FILE = "crawler_error_report.json"

def run_auto_crawler():
    print(f"[*] Starting Auto-Click Feature Error Scanner at {BASE_URL}...")
    errors_found = []
    visited_routes = set()
    clicked_elements = set()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 430, "height": 932}, # iPhone 15 Pro dimensions
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148"
        )
        page = context.new_page()

        # Listen to page errors and console errors
        def on_page_error(err):
            msg = f"[PAGE_CRASH] {str(err)}"
            print(f"[!] {msg}")
            errors_found.append({
                "type": "PAGE_CRASH",
                "message": str(err),
                "url": page.url,
                "timestamp": time.time()
            })

        def on_console_message(msg):
            if msg.type in ["error"]:
                text = msg.text
                # Filter out intentional / expected dev warnings
                if any(ignored in text for ignored in ["Failed to load resource: net::ERR_BLOCKED_BY_CLIENT", "Reduced motion setting", "props.pointerEvents"]):
                    return
                print(f"[!] [CONSOLE_ERROR] {text}")
                errors_found.append({
                    "type": "CONSOLE_ERROR",
                    "message": text,
                    "url": page.url,
                    "timestamp": time.time()
                })

        page.on("pageerror", on_page_error)
        page.on("console", on_console_message)

        try:
            print("[*] Navigating to root app...")
            page.goto(BASE_URL, wait_until="networkidle", timeout=30000)
            time.sleep(3)
        except Exception as e:
            print(f"[!] Failed to reach {BASE_URL}: {e}")
            errors_found.append({"type": "CONNECTION_ERROR", "message": str(e), "url": BASE_URL})

        # Scan and click accessible buttons, tabs, and interactive elements
        print("[*] Scanning interactive buttons and navigation tabs...")
        
        # Test main navigation routes
        routes = ["/", "/(tabs)", "/(tabs)/share", "/(tabs)/profile", "/(tabs)/orders", "/(tabs)/settings", "/(auth)/login"]
        for r in routes:
            try:
                target = f"{BASE_URL}{r}"
                print(f"--> Visiting route: {r}")
                page.goto(target, wait_until="domcontentloaded", timeout=10000)
                time.sleep(1.5)
                
                # Find all clickable buttons and pressables
                buttons = page.query_selector_all("div[role='button'], button, a")
                print(f"    Found {len(buttons)} interactive elements on {r}")
                
                for idx, btn in enumerate(buttons[:10]): # Click up to 10 key buttons per view safely
                    try:
                        text = (btn.inner_text() or "").strip().replace("\n", " ")
                        if not text or len(text) > 40:
                            continue
                        # Skip destructive clicks like real purchases or account delete
                        if any(w in text.lower() for w in ["delete", "remove", "pay now"]):
                            continue
                        
                        btn.click(timeout=1500)
                        time.sleep(0.5)
                    except Exception:
                        pass
            except Exception as e:
                errors_found.append({"type": "ROUTE_NAV_ERROR", "route": r, "message": str(e)})

        browser.close()

    # Save findings
    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        json.dump({
            "scanned_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "total_errors": len(errors_found),
            "errors": errors_found
        }, f, indent=2)

    print("\n" + "="*50)
    print(f"[*] Scan Complete! Total Issues Caught: {len(errors_found)}")
    print(f"[*] Detailed error log saved to: {os.path.abspath(REPORT_FILE)}")
    print("="*50 + "\n")

if __name__ == "__main__":
    run_auto_crawler()
