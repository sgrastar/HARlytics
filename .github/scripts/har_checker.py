import sys
import json
import re
import requests
from typing import Tuple, List

class HARChecker:
    def __init__(self):
        self.sensitive_patterns = {
            'cookie': r'cookie=[^;]+',
            'session': r'(sessionid|session_id|PHPSESSID)=[^;]+',
            'password': r'password=[\w\-\+\=\%]+',
            'email': r'[\w\.-]+@[\w\.-]+\.\w+',
            'api_key': r'([a-zA-Z0-9_-]*(token|key|api|secret)[a-zA-Z0-9_-]*)(:|=)\s*([a-zA-Z0-9_-]{32,})',
            'jwt': r'eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*',
            'auth_header': r'(Authorization|Bearer):?\s*[a-zA-Z0-9_\-\.=]+',
        }

    def download_and_check_har(self, url: str) -> Tuple[bool, List[str]]:
        """
        Download HAR file from URL and check for sensitive information
        Returns: (contains_sensitive: bool, found_patterns: List[str])
        """
        try:
            response = requests.get(url)
            response.raise_for_status()
            content = response.text

            # Verify it's a HAR file by checking JSON structure
            har_data = json.loads(content)
            if 'log' not in har_data:
                return False, ["Not a valid HAR file"]

            found_patterns = []
            for pattern_name, pattern in self.sensitive_patterns.items():
                if re.search(pattern, content, re.IGNORECASE):
                    found_patterns.append(pattern_name)

            return len(found_patterns) > 0, found_patterns

        except json.JSONDecodeError:
            return False, ["Invalid JSON format"]
        except requests.RequestException as e:
            return False, [f"Failed to download file: {str(e)}"]
        except Exception as e:
            return False, [f"Error processing file: {str(e)}"]

def main():
    if len(sys.argv) != 2:
        print("Usage: python har_checker.py <har_file_url>")
        sys.exit(1)

    checker = HARChecker()
    contains_sensitive, patterns = checker.download_and_check_har(sys.argv[1])
    
    # Output in JSON format for easy parsing
    result = {
        "contains_sensitive": contains_sensitive,
        "detected_patterns": patterns
    }
    print(json.dumps(result))
    sys.exit(0 if not contains_sensitive else 1)

if __name__ == "__main__":
    main()