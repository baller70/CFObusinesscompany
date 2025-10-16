
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ReportData {
  reportName: string
  reportType: string
  profileName: string
  profileType: string
  userName: string
  userEmail: string
  startDate: Date
  endDate: Date
  generatedDate: Date
  summary: {
    income: number
    expenses: number
    netIncome: number
    transactionCount: number
    totalAssets: number
    totalLiabilities: number
    netWorth: number
  }
  transactions: any[]
  transactionsByCategory: Record<string, { income: number; expenses: number; count: number }>
  budgets: any[]
  assets: any[]
  liabilities: any[]
}

export async function generateReportPDF(data: ReportData): Promise<Buffer> {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let yPosition = 20

  // Helper function to add letterhead
  const addLetterhead = () => {
    // Header background
    doc.setFillColor(30, 58, 138) // Blue background
    doc.rect(0, 0, pageWidth, 35, 'F')
    
    // Company name/logo
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('CFO Budgeting App', 15, 15)
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Financial Management Solutions', 15, 22)
    
    // Generated date on the right
    doc.setFontSize(9)
    doc.text(`Generated: ${data.generatedDate.toLocaleDateString()}`, pageWidth - 15, 15, { align: 'right' })
    doc.text(`Time: ${data.generatedDate.toLocaleTimeString()}`, pageWidth - 15, 20, { align: 'right' })
    
    // Reset text color
    doc.setTextColor(0, 0, 0)
  }

  // Helper function to add footer
  const addFooter = (pageNum: number) => {
    const footerY = pageHeight - 15
    
    // Footer line
    doc.setDrawColor(200, 200, 200)
    doc.line(15, footerY - 5, pageWidth - 15, footerY - 5)
    
    // Footer text
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.setFont('helvetica', 'normal')
    
    doc.text('CFO Budgeting App | Financial Report', 15, footerY)
    doc.text(`Page ${pageNum}`, pageWidth - 15, footerY, { align: 'right' })
    doc.text('Confidential - For Internal Use Only', pageWidth / 2, footerY, { align: 'center' })
    
    // Reset
    doc.setTextColor(0, 0, 0)
  }

  // Add letterhead to first page
  addLetterhead()
  yPosition = 45

  // Report Title
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 58, 138)
  doc.text(data.reportName, pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 10

  // Profile Information Box
  doc.setFillColor(243, 244, 246)
  doc.roundedRect(15, yPosition, pageWidth - 30, 25, 3, 3, 'F')
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('Profile Information', 20, yPosition + 7)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Profile: ${data.profileName} (${data.profileType})`, 20, yPosition + 13)
  doc.text(`Report Period: ${data.startDate.toLocaleDateString()} - ${data.endDate.toLocaleDateString()}`, 20, yPosition + 19)
  doc.text(`Prepared for: ${data.userName}`, pageWidth / 2 + 10, yPosition + 13)
  doc.text(`Email: ${data.userEmail}`, pageWidth / 2 + 10, yPosition + 19)
  
  yPosition += 35

  // Executive Summary Section
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 58, 138)
  doc.text('Executive Summary', 15, yPosition)
  yPosition += 8

  // Summary Cards
  const cardWidth = (pageWidth - 45) / 3
  const cardHeight = 30
  const cardStartY = yPosition

  // Income Card
  doc.setFillColor(220, 252, 231) // Light green
  doc.roundedRect(15, cardStartY, cardWidth, cardHeight, 3, 3, 'F')
  doc.setDrawColor(34, 197, 94)
  doc.setLineWidth(0.5)
  doc.roundedRect(15, cardStartY, cardWidth, cardHeight, 3, 3, 'S')
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(21, 128, 61)
  doc.text('Total Income', 20, cardStartY + 8)
  doc.setFontSize(16)
  doc.text(`$${data.summary.income.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 20, cardStartY + 20)

  // Expenses Card
  doc.setFillColor(254, 226, 226) // Light red
  doc.roundedRect(15 + cardWidth + 7.5, cardStartY, cardWidth, cardHeight, 3, 3, 'F')
  doc.setDrawColor(239, 68, 68)
  doc.roundedRect(15 + cardWidth + 7.5, cardStartY, cardWidth, cardHeight, 3, 3, 'S')
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(185, 28, 28)
  doc.text('Total Expenses', 20 + cardWidth + 7.5, cardStartY + 8)
  doc.setFontSize(16)
  doc.text(`$${data.summary.expenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 20 + cardWidth + 7.5, cardStartY + 20)

  // Net Income Card
  const netIncomeColor = data.summary.netIncome >= 0 
    ? { bg: [219, 234, 254] as [number, number, number], border: [59, 130, 246] as [number, number, number], text: [30, 64, 175] as [number, number, number] } 
    : { bg: [254, 226, 226] as [number, number, number], border: [239, 68, 68] as [number, number, number], text: [185, 28, 28] as [number, number, number] }
  doc.setFillColor(netIncomeColor.bg[0], netIncomeColor.bg[1], netIncomeColor.bg[2])
  doc.roundedRect(15 + 2 * (cardWidth + 7.5), cardStartY, cardWidth, cardHeight, 3, 3, 'F')
  doc.setDrawColor(netIncomeColor.border[0], netIncomeColor.border[1], netIncomeColor.border[2])
  doc.roundedRect(15 + 2 * (cardWidth + 7.5), cardStartY, cardWidth, cardHeight, 3, 3, 'S')
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(netIncomeColor.text[0], netIncomeColor.text[1], netIncomeColor.text[2])
  doc.text('Net Income', 20 + 2 * (cardWidth + 7.5), cardStartY + 8)
  doc.setFontSize(16)
  doc.text(`$${data.summary.netIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 20 + 2 * (cardWidth + 7.5), cardStartY + 20)

  yPosition = cardStartY + cardHeight + 10

  // Additional metrics
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`Total Transactions: ${data.summary.transactionCount}`, 15, yPosition)
  doc.text(`Categories: ${Object.keys(data.transactionsByCategory).length}`, pageWidth / 2, yPosition, { align: 'center' })
  
  if (data.summary.totalAssets > 0 || data.summary.totalLiabilities > 0) {
    doc.text(`Net Worth: $${data.summary.netWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 15, yPosition, { align: 'right' })
  }
  
  yPosition += 12

  // Transaction by Category Section
  if (Object.keys(data.transactionsByCategory).length > 0) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 58, 138)
    doc.text('Transactions by Category', 15, yPosition)
    yPosition += 5

    const categoryData = Object.entries(data.transactionsByCategory).map(([category, data]) => [
      category,
      `$${data.income.toFixed(2)}`,
      `$${data.expenses.toFixed(2)}`,
      `$${(data.income - data.expenses).toFixed(2)}`,
      data.count.toString()
    ])

    autoTable(doc, {
      startY: yPosition,
      head: [['Category', 'Income', 'Expenses', 'Net', 'Count']],
      body: categoryData,
      theme: 'striped',
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      margin: { left: 15, right: 15 }
    })

    yPosition = (doc as any).lastAutoTable.finalY + 10
  }

  // Add footer to first page
  addFooter(1)

  // Check if we need a new page for transactions
  if (yPosition > pageHeight - 60) {
    doc.addPage()
    addLetterhead()
    yPosition = 45
    addFooter(2)
  }

  // Detailed Transactions Section
  if (data.transactions.length > 0) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 58, 138)
    doc.text('Transaction Details', 15, yPosition)
    yPosition += 5

    const transactionData = data.transactions.slice(0, 50).map(t => [
      new Date(t.date).toLocaleDateString(),
      t.description.substring(0, 30),
      t.category || 'N/A',
      t.type,
      `$${t.amount.toFixed(2)}`
    ])

    let currentPage = 2
    autoTable(doc, {
      startY: yPosition,
      head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
      body: transactionData,
      theme: 'striped',
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 7
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      margin: { left: 15, right: 15, top: 45, bottom: 20 },
      didDrawPage: (data) => {
        // Add letterhead and footer to each new page
        if (data.pageNumber > 1) {
          addLetterhead()
        }
        addFooter(data.pageNumber)
      }
    })

    yPosition = (doc as any).lastAutoTable.finalY + 10
    currentPage = doc.getCurrentPageInfo().pageNumber
  }

  // Budget Information
  if (data.budgets.length > 0) {
    if (yPosition > pageHeight - 60) {
      doc.addPage()
      addLetterhead()
      yPosition = 45
      addFooter(doc.getCurrentPageInfo().pageNumber)
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 58, 138)
    doc.text('Budget Information', 15, yPosition)
    yPosition += 5

    const budgetData = data.budgets.map(b => [
      b.category,
      `$${b.amount.toFixed(2)}`,
      `${b.month}/${b.year}`,
      b.notes || 'N/A'
    ])

    autoTable(doc, {
      startY: yPosition,
      head: [['Category', 'Budget Amount', 'Period', 'Notes']],
      body: budgetData,
      theme: 'striped',
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      margin: { left: 15, right: 15 },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          addLetterhead()
        }
        addFooter(data.pageNumber)
      }
    })

    yPosition = (doc as any).lastAutoTable.finalY + 10
  }

  // Assets and Liabilities (for Net Worth reports)
  if ((data.assets.length > 0 || data.liabilities.length > 0) && data.reportType === 'Net Worth Statement') {
    if (yPosition > pageHeight - 100) {
      doc.addPage()
      addLetterhead()
      yPosition = 45
      addFooter(doc.getCurrentPageInfo().pageNumber)
    }

    // Assets
    if (data.assets.length > 0) {
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(30, 58, 138)
      doc.text('Assets', 15, yPosition)
      yPosition += 5

      const assetData = data.assets.map((a: any) => [
        a.name,
        a.type,
        `$${(a.value || 0).toFixed(2)}`,
        a.purchaseDate ? new Date(a.purchaseDate).toLocaleDateString() : 'N/A'
      ])

      autoTable(doc, {
        startY: yPosition,
        head: [['Asset Name', 'Type', 'Current Value', 'Acquisition Date']],
        body: assetData,
        theme: 'striped',
        headStyles: {
          fillColor: [30, 58, 138],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 8
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251]
        },
        margin: { left: 15, right: 15 },
        didDrawPage: (data) => {
          if (data.pageNumber > 1) {
            addLetterhead()
          }
          addFooter(data.pageNumber)
        }
      })

      yPosition = (doc as any).lastAutoTable.finalY + 10
    }

    // Liabilities
    if (data.liabilities.length > 0) {
      if (yPosition > pageHeight - 60) {
        doc.addPage()
        addLetterhead()
        yPosition = 45
        addFooter(doc.getCurrentPageInfo().pageNumber)
      }

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(30, 58, 138)
      doc.text('Liabilities', 15, yPosition)
      yPosition += 5

      const liabilityData = data.liabilities.map((l: any) => [
        l.name,
        l.type,
        `$${l.balance.toFixed(2)}`,
        `${(l.interestRate || 0).toFixed(2)}%`
      ])

      autoTable(doc, {
        startY: yPosition,
        head: [['Liability Name', 'Type', 'Current Balance', 'Interest Rate']],
        body: liabilityData,
        theme: 'striped',
        headStyles: {
          fillColor: [30, 58, 138],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 8
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251]
        },
        margin: { left: 15, right: 15 },
        didDrawPage: (data) => {
          if (data.pageNumber > 1) {
            addLetterhead()
          }
          addFooter(data.pageNumber)
        }
      })
    }
  }

  // Disclaimer section on last page
  const finalY = (doc as any).lastAutoTable?.finalY || yPosition
  if (finalY > pageHeight - 50) {
    doc.addPage()
    addLetterhead()
    yPosition = 45
    addFooter(doc.getCurrentPageInfo().pageNumber)
  } else {
    yPosition = finalY + 15
  }

  doc.setFillColor(255, 243, 205)
  doc.roundedRect(15, yPosition, pageWidth - 30, 30, 3, 3, 'F')
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(120, 53, 15)
  doc.text('Important Notice', 20, yPosition + 7)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(80, 40, 10)
  const disclaimerText = 'This report is generated automatically from your financial data and is intended for informational purposes only. Please verify all figures and consult with a qualified financial advisor for important financial decisions. All data is accurate as of the generation date and may not reflect recent transactions.'
  const splitDisclaimer = doc.splitTextToSize(disclaimerText, pageWidth - 50)
  doc.text(splitDisclaimer, 20, yPosition + 15)

  // Convert to buffer
  const pdfOutput = doc.output('arraybuffer')
  return Buffer.from(pdfOutput)
}
