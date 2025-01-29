import sys
import json
import re
import requests
from typing import Tuple, List, Dict

class ContentChecker:
    def __init__(self):
        self.sensitive_patterns = {
            'cookie': [
                r'cookie=[^;]+',
                r'set-cookie:[^;]+',
            ],
            'session': [
                r'(sessionid|session_id|PHPSESSID)=[^;]+',
                r'session_token["\']?\s*[:=]\s*["\']?[a-zA-Z0-9_\-\.]+',
            ],
            'password': [
                r'password\s*[=:]\s*[^\s&]+',
                r'pass(?:word)?["\']?\s*[:=]\s*["\'][^"\']+["\']',
            ],
            'email': [
                r'[\w\.-]+@[\w\.-]+\.\w+',
            ],
            'api_key': [
                r'(?:api[_-]?key|token|secret|private[_-]?key)["\']?\s*[:=]\s*["\']?[a-zA-Z0-9_\-\.]{32,}["\']?',
                r'sk_(?:test|live)_[a-zA-Z0-9]{24,}',
            ],
            'jwt': [
                r'eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*',
            ],
            'auth_header': [
                r'authorization:\s*bearer\s+[a-zA-Z0-9_\-\.=]+',
                r'x-api-key:\s*[a-zA-Z0-9_\-\.=]+',
            ],
        }

    def download_and_check_content(self, url: str) -> Tuple[bool, List[str]]:
        """
        Download file from URL and check for sensitive information
        Returns: (contains_sensitive: bool, found_patterns: List[str])
        """
        try:
            response = requests.get(url)
            response.raise_for_status()
            content = response.text

            # Try parsing as JSON first
            try:
                json_content = json.loads(content)
                content = json.dumps(json_content)  # Normalize JSON format
            except json.JSONDecodeError:
                pass  # Not JSON, proceed with raw content

            found_patterns = set()
            for category, patterns in self.sensitive_patterns.items():
                for pattern in patterns:
                    if re.search(pattern, content, re.IGNORECASE | re.MULTILINE):
                        found_patterns.add(category)
                        break  # One match per category is enough

            return len(found_patterns) > 0, list(found_patterns)

        except requests.RequestException as e:
            return False, [f"Failed to download file: {str(e)}"]
        except Exception as e:
            return False, [f"Error processing file: {str(e)}"]

def main():
    if len(sys.argv) != 2:
        print("Usage: python content_checker.py <file_url>")
        sys.exit(1)

    checker = ContentChecker()
    contains_sensitive, patterns = checker.download_and_check_content(sys.argv[1])
    
    result = {
        "contains_sensitive": contains_sensitive,
        "detected_patterns": patterns
    }
    print(json.dumps(result))
    sys.exit(0 if not contains_sensitive else 1)

if __name__ == "__main__":
    main()