
<p align="center">
![HARlytics Icon](https://github.com/sgrastar/HARlytics/blob/images/images/icon_128.png)
</p>
<h1 align="center">
HARlytics
</h1>
<p align="center">
Making HTTP tell its story
</p>


[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/{extension-id})](https://chrome.google.com/webstore/detail/{extension-id})
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fsgrastar%2Fhar-analyzer.svg?type=shield&issueType=license)](https://app.fossa.com/projects/git%2Bgithub.com%2Fsgrastar%2Fhar-analyzer?ref=badge_shield&issueType=license)


HARlytics is a powerful HAR file analyzer that transforms complex HTTP Archive files into actionable insights. Perfect for developers, QA engineers, and security professionals who need to analyze web application behavior and performance.

<p align="center">

![Screenshot of HARlytics](https://github.com/sgrastar/HARlytics/blob/images/images/screenshot_1_0_0_3.png)

![Screenshot of HARlytics](https://github.com/sgrastar/HARlytics/blob/images/images/screenshot_1_0_0_4.png)
</p>

## 🚀 Getting Started

### Option 1: Chrome Extension

1. Visit [Chrome Web Store](your-extension-url)
2. Click "Add to Chrome"
3. Click the Extensions menu (puzzle piece icon) in your browser toolbar and pin HARlytics for easy access

### Option 2: Web Application

Access the web version directly:
[https://harlytics.sgrastar.com/](https://harlytics.sgrastar.com/)

## ✨ Key Features

### 🎯 Advanced Filtering
- Multi-domain filtering with quick toggles
- HTTP method filtering (GET, POST, PUT, etc.)
- Status code and MIME type filtering
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
- Save sequence diagrams as images (Coming Soon!)

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

## 📸 Screenshots
(Screenshots will be added soon)

## 🔒 Privacy & Security

- All analysis is performed locally in your browser
- No external data transmission required
- Zero data storage or collection


## 🛠️ Technical Details

Built with these amazing tools, libraries, and packages. Thanks to all the open-source contributors who made this project possible.

 - **Framework & UI**: Svelte 4(JavaScript), Flowbite-Svelte, Flowbite-Svelte-icon, Tailwind CSS
 - **Testing & Coverage**: Vitest, jest-dom
 - **Data Visualization**: Mermaid, D3.js
 - **Build Tools**: Vite, PostCSS, Autoprefixer
 - **Browser Extension**: SvelteKit Chrome Extension Adapter

##  Support

Need help? Please create an [Issue](https://github.com/sgrastar/HARlytics/issues) on our GitHub repository.

## 📋 Roadmap

Coming features:
- Sanitize confidential and personal information
- Compare two HAR files

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