# ZEHSSCWU QR Attendance System

A web-based QR code attendance system designed for the Zimbabwe Educational Health Scientific Social Cultural Workers Union (ZEHSSCWU). This system allows union members to check in to meetings quickly by scanning their QR codes or entering their member IDs manually. Attendance data is logged in real-time using Google Sheets and Google Apps Script.

## Features

- Real-time QR code scanning using the device camera.  
- Manual entry option for member IDs.
- Attendance logged directly to Google Sheets backend via Google Apps Script.  
- Displays attendance stats: Present count, total registered members, attendance rate, and last scan time.  
- Responsive and clean UI with minimal images for easy loading.  
- Audio feedback on successful scans  

## How it Works

1. The user scans their QR code using the built-in camera scanner on the page.  
2. The scanned member ID is sent to a Google Apps Script web app endpoint which validates and logs the attendance in a Google Sheet.  
3. Attendance stats and recent entries update live on the page.  
4. Manual member ID entry is also supported for cases when scanning is not possible.

## Setup Instructions

### Prerequisites

- A Google account  
- Access to create Google Sheets and Google Apps Script projects  

### Steps

1. Clone or download this repository.  
2. Deploy your Google Apps Script backend and update the `sheetURL` variable in `script.js` with your deployed script URL.  
3. Host the frontend on GitHub Pages or any static web hosting platform.  
4. Share the hosted URL with union members for live attendance tracking.

## Technologies Used

- HTML5 & CSS3  
- JavaScript (Vanilla)  
- [html5-qrcode](https://github.com/mebjas/html5-qrcode) library for QR scanning  
- Google Apps Script & Google Sheets as backend

## Live Demo

[https://mondli-02.github.io/union-qr-attendance/](https://mondli-02.github.io/union-qr-attendance/)

## License

This project is licensed under the MIT License.

## Contact

Developed by Mondliwethu Moyo  
Email: dmoyo3574@gmail.com  
