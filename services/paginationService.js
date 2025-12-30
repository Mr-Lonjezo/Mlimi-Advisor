// services/paginationService.js - USSD Pagination Service
class PaginationService {
    constructor() {
        this.MAX_PAGE_CHARS = 160; // Safe USSD limit
        this.MAX_LINES_PER_PAGE = 8; // Typical phone screen lines
        console.log('✅ Pagination Service initialized');
    }

    paginateForUSSD(content, session, menuType = 'content') {
        console.log(`📱 Paginating ${menuType} content (${content.length} chars)`);
        
        // Clean and prepare content
        const cleanContent = this.cleanContent(content);
        const pages = this.splitIntoPages(cleanContent);
        
        // If it's just one page, return it directly
        if (pages.length === 1) {
            return {
                currentPage: 1,
                totalPages: 1,
                content: pages[0],
                isPaginated: false
            };
        }
        
        // Handle pagination with session
        return this.handlePagination(pages, session, menuType);
    }

    cleanContent(content) {
        // Remove excessive whitespace
        let cleaned = content.replace(/\n\s*\n\s*\n/g, '\n\n');
        
        // Ensure consistent line endings
        cleaned = cleaned.replace(/\r\n/g, '\n');
        
        // Trim each line
        const lines = cleaned.split('\n').map(line => line.trim());
        
        // Remove empty lines at start and end
        while (lines.length > 0 && lines[0] === '') lines.shift();
        while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
        
        return lines.join('\n');
    }

    splitIntoPages(content) {
        const lines = content.split('\n');
        const pages = [];
        let currentPage = [];
        let currentChars = 0;
        
        for (const line of lines) {
            const lineWithNewline = line + '\n';
            const lineLength = lineWithNewline.length;
            
            // Check if adding this line would exceed limits
            if (currentChars + lineLength > this.MAX_PAGE_CHARS || 
                currentPage.length >= this.MAX_LINES_PER_PAGE) {
                
                // Save current page
                if (currentPage.length > 0) {
                    pages.push(currentPage.join('\n'));
                }
                
                // Start new page
                currentPage = [line];
                currentChars = line.length;
            } else {
                // Add to current page
                currentPage.push(line);
                currentChars += lineLength;
            }
        }
        
        // Add the last page if not empty
        if (currentPage.length > 0) {
            pages.push(currentPage.join('\n'));
        }
        
        console.log(`📄 Split into ${pages.length} pages`);
        return pages;
    }

    handlePagination(pages, session, menuType) {
        const pageKey = `${menuType}_page`;
        
        // Initialize pagination in session
        if (!session.pagination) {
            session.pagination = {};
        }
        
        if (!session.pagination[menuType]) {
            session.pagination[menuType] = {
                pages: pages,
                currentPage: 0, // 0-indexed
                totalPages: pages.length
            };
        }
        
        const pagination = session.pagination[menuType];
        const userInput = session.lastInput || '';
        
        // Handle navigation
        if (userInput === '99') {
            // Next page
            if (pagination.currentPage < pagination.totalPages - 1) {
                pagination.currentPage++;
                return this.formatPage(pagination, true);
            } else {
                // Already on last page
                return {
                    currentPage: pagination.currentPage + 1,
                    totalPages: pagination.totalPages,
                    content: pagination.pages[pagination.currentPage],
                    isPaginated: true,
                    isLastPage: true
                };
            }
        } else if (userInput === '98') {
            // Previous page
            if (pagination.currentPage > 0) {
                pagination.currentPage--;
                return this.formatPage(pagination, true);
            } else {
                // Already on first page
                return {
                    currentPage: 1,
                    totalPages: pagination.totalPages,
                    content: pagination.pages[0],
                    isPaginated: true,
                    isFirstPage: true
                };
            }
        } else if (userInput === '0') {
            // Exit pagination
            delete session.pagination[menuType];
            return null; // Signal to go back
        } else {
            // First time showing paginated content
            pagination.currentPage = 0;
            return this.formatPage(pagination, false);
        }
    }

    formatPage(pagination, isNavigation = false) {
        const pageNumber = pagination.currentPage + 1;
        const pageContent = pagination.pages[pagination.currentPage];
        
        let response = '';
        
        if (isNavigation) {
            response = `CON ${pageContent}\n`;
        } else {
            response = `CON ${pageContent}\n`;
        }
        
        // Add pagination controls
        response += '\n' + this.getPaginationControls(pageNumber, pagination.totalPages);
        
        return {
            currentPage: pageNumber,
            totalPages: pagination.totalPages,
            content: response,
            isPaginated: true,
            isLastPage: pageNumber === pagination.totalPages,
            isFirstPage: pageNumber === 1
        };
    }

    getPaginationControls(currentPage, totalPages) {
        let controls = '';
        
        if (totalPages > 1) {
            controls += `Page ${currentPage}/${totalPages}\n`;
            
            if (currentPage < totalPages) {
                controls += '99. Next Page\n';
            }
            
            if (currentPage > 1) {
                controls += '98. Prev Page\n';
            }
        }
        
        controls += '0. Back to Menu';
        return controls;
    }

    // Special pagination for weather data (structured format)
    paginateWeatherData(weatherData, districtName, session) {
        console.log(`🌤️ Paginating weather data for ${districtName}`);
        
        // Split weather data into logical sections
        const sections = this.splitWeatherIntoSections(weatherData, districtName);
        const pages = [];
        
        // Create pages for each section
        for (const section of sections) {
            const sectionPages = this.splitIntoPages(section);
            pages.push(...sectionPages);
        }
        
        // Handle pagination
        return this.handlePagination(pages, session, 'weather');
    }

    splitWeatherIntoSections(weatherData, districtName) {
        const sections = [];
        
        // Extract current weather
        const currentMatch = weatherData.match(/Now:[\s\S]*?(?=\n\n|\nToday:|$)/);
        if (currentMatch) {
            sections.push(`🌤️ ${districtName} - Current\n${currentMatch[0].trim()}`);
        }
        
        // Extract today's forecast
        const todayMatch = weatherData.match(/Today:[\s\S]*?(?=\n\nTomorrow:|$)/);
        if (todayMatch) {
            sections.push(`📅 Today's Forecast\n${todayMatch[0].trim()}`);
        }
        
        // Extract tomorrow's forecast
        const tomorrowMatch = weatherData.match(/Tomorrow:[\s\S]*?(?=\n\nDay After:|$)/);
        if (tomorrowMatch) {
            sections.push(`📅 Tomorrow's Forecast\n${tomorrowMatch[0].trim()}`);
        }
        
        // Extract day after's forecast
        const dayAfterMatch = weatherData.match(/Day After:[\s\S]*?(?=\n\n🌱|$)/);
        if (dayAfterMatch) {
            sections.push(`📅 Day After Forecast\n${dayAfterMatch[0].trim()}`);
        }
        
        // Extract farming tips
        const tipsMatch = weatherData.match(/🌱[\s\S]*/);
        if (tipsMatch) {
            sections.push(`🌱 Farming Tips\n${tipsMatch[0].trim()}`);
        }
        
        return sections.filter(section => section.length > 0);
    }

    // Special pagination for pest advice
    paginatePestAdvice(advice, cropName, session) {
        console.log(`🐛 Paginating pest advice for ${cropName}`);
        
        // Split by pest (each pest is a section)
        const pests = advice.split(/\n\n+/);
        const pages = [];
        
        let currentSection = '';
        for (const pest of pests) {
            if (currentSection.length + pest.length > this.MAX_PAGE_CHARS * 0.8) {
                pages.push(currentSection.trim());
                currentSection = pest + '\n\n';
            } else {
                currentSection += pest + '\n\n';
            }
        }
        
        if (currentSection.trim().length > 0) {
            pages.push(currentSection.trim());
        }
        
        // Add crop name to first page
        if (pages.length > 0) {
            pages[0] = `🐛 ${cropName} - Pest Advice\n\n${pages[0]}`;
        }
        
        return this.handlePagination(pages, session, 'pests');
    }

    // Special pagination for market prices
    paginateMarketPrices(prices, cropName, session) {
        console.log(`💰 Paginating market prices for ${cropName}`);
        
        const header = `💰 ${cropName} - Market Prices\n\n`;
        const pages = this.splitIntoPages(header + prices);
        
        return this.handlePagination(pages, session, 'prices');
    }
}

module.exports = new PaginationService();