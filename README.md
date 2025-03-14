<p align="center">
<img src="https://github.com/sgrastar/HARlytics/blob/images/images/icon_128.png" height="150" alt="HARlytics Icon">
</p>
<h1 align="center">
HARlytics
</h1>
<p align="center">
Making HTTP tell its story
</p>

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/hecpjmmgpbecpeigmoilgcljdkidlbgm)](https://chrome.google.com/webstore/detail/hecpjmmgpbecpeigmoilgcljdkidlbgm)
[![Edge Add-ons Download](https://img.shields.io/badge/Edge%20Add--ons-Download-blue)](https://microsoftedge.microsoft.com/addons/detail/harlytics/dhhndkibkdekohnpmhaeeegkcpmpjben)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fsgrastar%2FHARlytics.svg?type=shield&issueType=license)](https://app.fossa.com/projects/git%2Bgithub.com%2Fsgrastar%2FHARlytics?ref=badge_shield&issueType=license)

[Website](https://harlytics.com/)

HARlytics is a powerful HAR file analyzer that transforms complex HTTP Archive files into actionable insights. Perfect for developers, QA engineers, and security professionals who need to analyze web application behavior and performance.

<p align="center">

![Screenshot of HARlytics](https://github.com/sgrastar/HARlytics/blob/images/images/screenshot_1_0_0_3.png)

![Screenshot of HARlytics](https://github.com/sgrastar/HARlytics/blob/images/images/screenshot_1_0_0_4.png)
</p>

## 🚀 Getting Started

### Option 1: Chrome or Edge Extension

<!-- 1. Visit [Chrome Web Store](your-extension-url) -->
1. Visit [Chrome Web Store](https://chrome.google.com/webstore/detail/hecpjmmgpbecpeigmoilgcljdkidlbgm) or [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/harlytics/dhhndkibkdekohnpmhaeeegkcpmpjben)
2. Click "Add to Chrome" or "Get" button
3. Click the Extensions menu (puzzle piece icon) in your browser toolbar and pin HARlytics for easy access

### Option 2: Web Application

Access the web version directly:

[https://cloud.harlytics.com/](https://cloud.harlytics.com/)

(Note: This site use [Cloudflare Web Analytics](https://www.cloudflare.com/web-analytics/))

## ✨ Key Features

### 🎯 Advanced Filtering
- Multi-domain filtering with quick toggles
- HTTP method filtering (GET, POST, PUT, etc.)
- Status code and MIME type filtering
- Filter by presence of Authorization headers, PostData, Query Parameters, and Set-Cookie headers
- Flexible URL pattern matching
- Real-time filter updates

### 📊 Comprehensive Views
- **Detailed View**: Complete HTTP request/response information with headers and waterfall diagrams
- **Sequence View**: Auto-generated sequence diagrams (Mermaid & PlantUML)
- **Cookie View**: Focus on cookies sent or received from the server

### 💫 Professional Analysis Tools
- Response header inspection
- Cookie tracking
- Query Parameter & POST data analysis
- Waterfall timing visualization
- Cache status tracking

### 📤 Export Options
- Export filtered data to CSV
- Download sequence diagrams in Mermaid/PlantUML format
- Save sequence diagrams as images

## 🔎 Quick Start Guide

1. **Load Your HAR File**
   - Drag and drop your HAR file or use the file selector

2. **Apply Filters**
   - Filter by domain using the domain selector
   - Use URL filters to find specific requests
   - Filter by HTTP methods, status codes, or MIME types

3. **Analyze Data**
   - Switch between Detail, Sequence, and Statistics views
   - Use waterfall diagrams to analyze timing
   - Generate sequence diagrams for documentation

4. **Export Results**
   - Download filtered data as CSV
   - Export sequence diagrams in multiple formats
   - Share findings with your team


## 🔒 Privacy & Security

- All analysis is performed locally in your browser
- No external data transmission required
- Zero data storage or collection


## 🛠️ Technical Details

Built with these amazing tools, libraries, and packages. Thanks to all the open-source contributors who made this project possible.

 - **Framework & UI**: Svelte, Flowbite-Svelte, Flowbite-Svelte-icon, Tailwind CSS
 - **Testing & Coverage**: Vitest, jest-dom
 - **Data Visualization**: Mermaid, D3.js
 - **Build Tools**: Vite, PostCSS, Autoprefixer
 - **Browser Extension**: SvelteKit Chrome Extension Adapter

## 📋 Roadmap

Please refer to the following issues for future development plans.

[TODO List](https://github.com/sgrastar/HARlytics/issues/1)

Please create a new issue for feature requests or bug reports.

[Bug Report](https://github.com/sgrastar/HARlytics/issues/new?template=issue_template_bug_report.yml)

[Feature Request](https://github.com/sgrastar/HARlytics/issues/new?template=issue_template_feature_request.yml)



## 📄 License

The MIT License (MIT)

Copyright (c) 2024 Yuta Hoshina <yuta@sgrastar.org> (https://github.com/sgrastar/HARlytics)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.