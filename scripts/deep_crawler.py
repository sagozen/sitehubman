import sys
import time
import json
import os
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:8081"
REPORT_FILE = "crawler_error_report.json"

ROUTES_TO_TEST = [
    "/",
    "/(tabs)",
    "/(tabs)/share",
    "/(tabs)/profile",
    "/(tabs)/orders",
    "/(tabs)/settings",
    "/(auth)/login",
    "/(auth)/register",
    "/guest-design",
    "/cards/settings",
    "/analytics",
    "/help",
    "/pricing",
    "/cards/upgrade",
]

def run_deep_crawler():
    print(f"[*] Launching Deep Playwright UI Stress-Tester at {BASE_URL}...")
    errors_found = []
    actions_performed = []
    pages_visited = 0
    total_clicks = 0

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 430, "height": 932},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
        )
        page = context.new_page()

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
            if msg.type == "error":
                text = msg.text
                # Filter harmless network/dev warnings
                if any(x in text for x in ["net::ERR_BLOCKED_BY_CLIENT", "Reduced motion", "shadow*", "textShadow*", "props.pointerEvents"]):
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

        for route in ROUTES_TO_TEST:
            target_url = f"{BASE_URL}{route}"
            pages_visited += 1
            print(f"\n==========================================")
            print(f"[*] Navigating to: {route}")
            try:
                page.goto(target_url, wait_until="load", timeout=12000)
                time.sleep(1.2)
            except Exception as e:
                print(f"[!] Nav failed for {route}: {e}")
                errors_found.append({"type": "NAVIGATION_ERROR", "route": route, "message": str(e)})
                continue

            # Identify all interactive elements using computed CSS cursor: pointer or role=button
            clickables_info = page.evaluate('''() => {
                const all = Array.from(document.querySelectorAll('*'));
                const matched = [];
                for (const el of all) {
                    const style = window.getComputedStyle(el);
                    const isClickable = style.cursor === 'pointer' || 
                                        el.getAttribute('role') === 'button' || 
                                        el.getAttribute('role') === 'tab' ||
                                        el.tagName === 'BUTTON' || 
                                        el.tagName === 'A';
                    const rect = el.getBoundingClientRect();
                    // Must be visible and distinct
                    if (isClickable && rect.width >= 24 && rect.height >= 24 && style.visibility !== 'hidden' && style.display !== 'none') {
                        // Check if child already covered to avoid clicking parents of parents
                        const label = (el.innerText || el.getAttribute('aria-label') || '').slice(0, 30).trim().replace(/\\n/g, ' ');
                        matched.push({
                            selector: el.tagName.toLowerCase(),
                            text: label,
                            x: rect.x + rect.width / 2,
                            y: rect.y + rect.height / 2
                        });
                    }
                }
                return matched;
            }''')

            # Filter unique coordinate points to prevent clicking the exact same nested box
            unique_targets = []
            seen_points = set()
            for item in clickables_info:
                pt = (round(item['x'] / 10) * 10, round(item['y'] / 10) * 10)
                if pt not in seen_points:
                    seen_points.add(pt)
                    unique_targets.append(item)

            print(f"[*] Found {len(unique_targets)} distinct interactive buttons/tiles on {route}")

            # Click through up to 8 distinct buttons on each page
            clicks_on_this_page = 0
            for item in unique_targets[:8]:
                label = item['text'] or '(Icon button)'
                # Avoid destructive actions
                if any(w in label.lower() for w in ['delete', 'remove', 'purge', 'unlink']):
                    continue

                try:
                    page.mouse.click(item['x'], item['y'])
                    clicks_on_this_page += 1
                    total_clicks += 1
                    actions_performed.append({
                        "route": route,
                        "clicked_label": label,
                        "point": (item['x'], item['y'])
                    })
                    time.sleep(0.4)
                except Exception as e:
                    errors_found.append({
                        "type": "CLICK_EXECUTION_ERROR",
                        "route": route,
                        "label": label,
                        "message": str(e)
                    })

            print(f"[*] Successfully executed {clicks_on_this_page} clicks on {route}")

        browser.close()

    summary = {
        "scanned_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "pages_visited": pages_visited,
        "total_buttons_clicked": total_clicks,
        "total_errors": len(errors_found),
        "actions_performed": actions_performed,
        "errors": errors_found
    }

    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print("\n" + "="*50)
    print(f"[*] Deep Stress-Test Complete!")
    print(f"[*] Pages Visited: {pages_visited}")
    print(f"[*] Buttons & Features Clicked: {total_clicks}")
    print(f"[*] Errors / Exceptions Found: {len(errors_found)}")
    print(f"[*] Detailed Report Saved to: {os.path.abspath(REPORT_FILE)}")
    print("="*50 + "\n")

if __name__ == "__main__":
    run_deep_crawler()
