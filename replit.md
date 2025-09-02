# Photography Portfolio

## Overview

A modern, dark-themed photography portfolio website that allows visitors to view a curated gallery and provides password-protected functionality for uploading new images. The application features a responsive design with smooth navigation, image modal viewing, and an administrative upload interface. Built with vanilla HTML, CSS, and JavaScript, it uses browser localStorage for session management and includes drag-and-drop file upload capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Static Website Structure**: Built with vanilla HTML, CSS, and JavaScript without frameworks
- **Responsive Design**: Mobile-first approach using CSS Grid and Flexbox for layout
- **Dark Theme**: Consistent dark navy color palette defined in CSS custom properties
- **Component-Based CSS**: Modular styling with reusable components and utility classes

### Navigation System
- **Single Page Application (SPA)**: Uses hash-based routing with smooth scrolling
- **Scroll Spy**: Automatically highlights active navigation links based on scroll position
- **Mobile Navigation**: Collapsible hamburger menu for mobile devices

### Authentication System
- **Client-Side Authentication**: Simple password protection using Base64 encoding
- **Session Management**: Uses localStorage to maintain authentication state
- **Time-Based Sessions**: 24-hour session duration with automatic expiration
- **Multiple Password Support**: Configurable password system for different access levels

### Image Management
- **Static Gallery**: Pre-defined gallery items with Unsplash placeholder images
- **Upload Interface**: Drag-and-drop file upload with visual feedback
- **Modal Viewing**: Full-screen image viewer with navigation controls
- **Lazy Loading**: Images load only when needed to improve performance

### File Upload System
- **Drag and Drop**: Native HTML5 file API for intuitive file selection
- **Visual Feedback**: Dropzone highlighting and upload progress indicators
- **Client-Side Processing**: File handling and preview generation in browser
- **Multiple File Support**: Batch upload capabilities with individual file management

## External Dependencies

### CDN Resources
- **Google Fonts**: Inter font family for consistent typography
- **Feather Icons**: Icon library for UI elements and navigation
- **Unsplash**: External image service for placeholder gallery content

### Browser APIs
- **File API**: For handling file uploads and drag-and-drop functionality
- **localStorage**: For client-side session and authentication management
- **Intersection Observer**: For scroll-based navigation and lazy loading (planned)

### Third-Party Services
- **Unsplash Images**: Provides high-quality placeholder images for the gallery
- **No Backend Dependencies**: Fully client-side application with no server requirements
- **No Database**: Uses browser storage for temporary session management