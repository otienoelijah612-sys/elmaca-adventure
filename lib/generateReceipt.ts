export interface ReceiptData {
    bookingId: string;
    customerName: string;
    adventureTitle: string;
    amountPaid: number;
    tripTotal: number;
    remainingBalance: number;
    receiptNumber?: string | null;
    phoneNumber?: string | null;
    transactionDate?: string | number | null;
  }
  
  const formatAmount = (amount: number) =>
    `KSh ${Number(amount || 0).toLocaleString()}`;
  
  /**
   * Formats an M-Pesa transaction date or a normal
   * JavaScript/ISO date into a readable Kenyan date.
   *
   * M-Pesa commonly returns:
   *
   * YYYYMMDDHHmmss
   *
   * Example:
   *
   * 20260822160909
   *
   * Which means:
   *
   * 22 Aug 2026, 16:09
   */
  const formatDate = (
    value?: string | number | null,
  ) => {
    // No date supplied
    if (!value) {
      return new Date().toLocaleString("en-KE", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    }
  
    const rawValue = String(value).trim();
  
    // ----------------------------------------
    // M-Pesa transaction date
    // ----------------------------------------
    //
    // Format:
    // YYYYMMDDHHmmss
    //
    // Example:
    // 20260822160909
    //
    // IMPORTANT:
    // Do NOT pass this directly to new Date()
    // because JavaScript would interpret it
    // incorrectly as milliseconds.
    // ----------------------------------------
  
    if (/^\d{14}$/.test(rawValue)) {
      const year = Number(
        rawValue.slice(0, 4),
      );
  
      const month = Number(
        rawValue.slice(4, 6),
      ) - 1;
  
      const day = Number(
        rawValue.slice(6, 8),
      );
  
      const hour = Number(
        rawValue.slice(8, 10),
      );
  
      const minute = Number(
        rawValue.slice(10, 12),
      );
  
      const second = Number(
        rawValue.slice(12, 14),
      );
  
      const date = new Date(
        year,
        month,
        day,
        hour,
        minute,
        second,
      );
  
      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleString("en-KE", {
          dateStyle: "medium",
          timeStyle: "short",
        });
      }
    }
  
    // ----------------------------------------
    // Normal ISO / JavaScript date
    // ----------------------------------------
  
    const date = new Date(rawValue);
  
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString("en-KE", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    }
  
    // ----------------------------------------
    // Unknown format
    // ----------------------------------------
  
    return rawValue;
  };
  
  const drawWrappedText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
  ) => {
    const words = text.split(" ");
  
    let line = "";
  
    for (
      let i = 0;
      i < words.length;
      i++
    ) {
      const testLine =
        line +
        (line ? " " : "") +
        words[i];
  
      const width =
        ctx.measureText(testLine).width;
  
      if (
        width > maxWidth &&
        line
      ) {
        ctx.fillText(
          line,
          x,
          y,
        );
  
        line = words[i];
  
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
  
    if (line) {
      ctx.fillText(
        line,
        x,
        y,
      );
  
      y += lineHeight;
    }
  
    return y;
  };
  
  export async function generateReceipt(
    data: ReceiptData,
  ): Promise<void> {
    // ----------------------------------------
    // Browser check
    // ----------------------------------------
  
    if (
      typeof window === "undefined" ||
      typeof document === "undefined"
    ) {
      return;
    }
  
    // ----------------------------------------
    // Create canvas
    // ----------------------------------------
  
    const canvas =
      document.createElement(
        "canvas",
      );
  
    const width = 1200;
    const height = 1500;
  
    canvas.width = width;
    canvas.height = height;
  
    const ctx =
      canvas.getContext("2d");
  
    if (!ctx) {
      throw new Error(
        "Unable to create receipt.",
      );
    }
  
    // ----------------------------------------
    // Background
    // ----------------------------------------
  
    ctx.fillStyle = "#f8fafc";
  
    ctx.fillRect(
      0,
      0,
      width,
      height,
    );
  
    // ----------------------------------------
    // Main receipt card
    // ----------------------------------------
  
    ctx.fillStyle = "#ffffff";
  
    ctx.beginPath();
  
    ctx.roundRect(
      70,
      60,
      width - 140,
      height - 120,
      30,
    );
  
    ctx.fill();
  
    // ----------------------------------------
    // Header
    // ----------------------------------------
  
    ctx.textAlign = "center";
  
    ctx.fillStyle = "#ff6b00";
  
    ctx.font =
      "bold 28px Arial";
  
    ctx.fillText(
      "ELMACA ADVENTURE",
      width / 2,
      130,
    );
  
    ctx.fillStyle = "#0b1b33";
  
    ctx.font =
      "bold 46px Arial";
  
    ctx.fillText(
      "PAYMENT RECEIPT",
      width / 2,
      195,
    );
  
    ctx.fillStyle = "#64748b";
  
    ctx.font =
      "22px Arial";
  
    ctx.fillText(
      "Explore Life. Make Adventure. Connect Always.",
      width / 2,
      240,
    );
  
    // ----------------------------------------
    // Confirmation
    // ----------------------------------------
  
    ctx.fillStyle = "#dcfce7";
  
    ctx.beginPath();
  
    ctx.roundRect(
      120,
      285,
      width - 240,
      90,
      18,
    );
  
    ctx.fill();
  
    ctx.fillStyle = "#15803d";
  
    ctx.font =
      "bold 28px Arial";
  
    ctx.fillText(
      "✓ PAYMENT CONFIRMED",
      width / 2,
      342,
    );
  
    // ----------------------------------------
    // Details
    // ----------------------------------------
  
    let y = 430;
  
    const left = 150;
    const right = 1050;
  
    const drawRow = (
      label: string,
      value: string,
      valueColor = "#0b1b33",
    ) => {
      ctx.textAlign = "left";
  
      ctx.fillStyle = "#64748b";
  
      ctx.font =
        "22px Arial";
  
      ctx.fillText(
        label,
        left,
        y,
      );
  
      ctx.textAlign = "right";
  
      ctx.fillStyle =
        valueColor;
  
      ctx.font =
        "bold 23px Arial";
  
      ctx.fillText(
        value,
        right,
        y,
      );
  
      y += 72;
    };
  
    // ----------------------------------------
    // Booking ID
    // ----------------------------------------
  
    drawRow(
      "Booking ID",
      data.bookingId,
    );
  
    // ----------------------------------------
    // Customer
    // ----------------------------------------
  
    drawRow(
      "Customer",
      data.customerName,
    );
  
    // ----------------------------------------
    // Adventure
    // ----------------------------------------
  
    ctx.textAlign = "left";
  
    ctx.fillStyle = "#64748b";
  
    ctx.font =
      "22px Arial";
  
    ctx.fillText(
      "Adventure",
      left,
      y,
    );
  
    y += 34;
  
    ctx.fillStyle = "#0b1b33";
  
    ctx.font =
      "bold 23px Arial";
  
    y = drawWrappedText(
      ctx,
      data.adventureTitle,
      left,
      y,
      right - left,
      32,
    );
  
    y += 35;
  
    // ----------------------------------------
    // Amount Paid
    // ----------------------------------------
  
    drawRow(
      "Amount Paid",
      formatAmount(
        data.amountPaid,
      ),
      "#15803d",
    );
  
    // ----------------------------------------
    // Trip Total
    // ----------------------------------------
  
    drawRow(
      "Trip Total",
      formatAmount(
        data.tripTotal,
      ),
    );
  
    // ----------------------------------------
    // Remaining Balance
    // ----------------------------------------
  
    drawRow(
      "Remaining Balance",
      formatAmount(
        data.remainingBalance,
      ),
      "#ff6b00",
    );
  
    // ----------------------------------------
    // M-Pesa Receipt
    // ----------------------------------------
  
    if (
      data.receiptNumber
    ) {
      drawRow(
        "M-Pesa Receipt",
        data.receiptNumber,
      );
    }
  
    // ----------------------------------------
    // M-Pesa Number
    // ----------------------------------------
  
    if (
      data.phoneNumber
    ) {
      drawRow(
        "M-Pesa Number",
        data.phoneNumber,
      );
    }
  
    // ----------------------------------------
    // Transaction Date
    // ----------------------------------------
  
    drawRow(
      "Date",
      formatDate(
        data.transactionDate,
      ),
    );
  
    // ----------------------------------------
    // Divider
    // ----------------------------------------
  
    ctx.strokeStyle =
      "#e2e8f0";
  
    ctx.lineWidth = 2;
  
    ctx.beginPath();
  
    ctx.moveTo(
      left,
      y + 10,
    );
  
    ctx.lineTo(
      right,
      y + 10,
    );
  
    ctx.stroke();
  
    // ----------------------------------------
    // Footer
    // ----------------------------------------
  
    ctx.textAlign = "center";
  
    ctx.fillStyle = "#0b1b33";
  
    ctx.font =
      "bold 24px Arial";
  
    ctx.fillText(
      "Thank you for choosing Elmaca Adventure.",
      width / 2,
      y + 70,
    );
  
    ctx.fillStyle = "#64748b";
  
    ctx.font =
      "20px Arial";
  
    ctx.fillText(
      "Keep this receipt as proof of payment.",
      width / 2,
      y + 108,
    );
  
    ctx.fillStyle = "#94a3b8";
  
    ctx.font =
      "18px Arial";
  
    ctx.fillText(
      "elmacaadventure.co.ke",
      width / 2,
      y + 150,
    );
  
    // ----------------------------------------
    // Generate JPEG
    // ----------------------------------------
  
    const blob =
      await new Promise<Blob | null>(
        (resolve) =>
          canvas.toBlob(
            resolve,
            "image/jpeg",
            0.95,
          ),
      );
  
    if (!blob) {
      throw new Error(
        "Unable to generate receipt image.",
      );
    }
  
    // ----------------------------------------
    // Download JPEG
    // ----------------------------------------
  
    const url =
      URL.createObjectURL(
        blob,
      );
  
    const link =
      document.createElement(
        "a",
      );
  
    link.href = url;
  
    link.download =
      `Elmaca-Receipt-${data.bookingId}.jpg`;
  
    document.body.appendChild(
      link,
    );
  
    link.click();
  
    document.body.removeChild(
      link,
    );
  
    URL.revokeObjectURL(url);
  }