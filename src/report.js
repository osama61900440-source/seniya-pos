// report.js - 9-Page Bank Audit Report & Print/Export Engine
import {
  escapeHtml, fmt, todayISO, ETH_MONTHS, EXPENSE_CATEGORIES,
  gregorianToEthiopian, ethiopianYearStartGregorianISO, ethiopianBuckets,
  statsFor, dayStats, paymentBreakdown, expenseByCategory,
  totalCapitalCents, capitalAsOf, inventoryValueCents,
  verifyPaymentReconciliation, goalTrackerStats, capitalUtilizationStats,
  itemStock, ethLabel, freshProfile, freshLoanCenter,
  getRegistrationHistoryInfo
} from './core.js';

var _activeProfile = null;
export function setActiveReportProfile(p) { _activeProfile = p; }

export function officialStampSnippet(profile, options) {
  if (!profile) return "";
  options = options || {};
  var stampImg = profile.trademarkStamp || profile.trademarkLogo || "";
  var shopName = profile.shopName || "የድርጅት ማህተም";
  var tin = profile.tin ? ("TIN: " + profile.tin) : "";
  var opacity = options.opacity !== undefined ? options.opacity : 0.92;
  var rotation = options.rotation || "-7deg";

  if (stampImg) {
    return '<div class="official-stamp-container" style="display:inline-flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; pointer-events:none; page-break-inside:avoid; break-inside:avoid;">' +
      '<div style="position:relative; display:inline-block;">' +
        '<img src="' + escapeHtml(stampImg) + '" alt="Official Stamp" style="width:95px; height:95px; border-radius:50%; object-fit:cover; opacity:' + opacity + '; transform:rotate(' + rotation + '); filter:drop-shadow(0 2px 4px rgba(0,0,0,0.12)); border:2.5px solid #1e3a8a;" />' +
      '</div>' +
      '<div style="font-size:7.5px; font-weight:800; color:#1e3a8a; letter-spacing:0.5px; margin-top:2px; text-transform:uppercase;">ህጋዊ ማህተም / OFFICIAL STAMP</div>' +
    '</div>';
  }

  return '<div class="official-stamp-container" style="display:inline-flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; pointer-events:none; page-break-inside:avoid; break-inside:avoid;">' +
    '<div style="width:95px; height:95px; border-radius:50%; border:2px dashed #1e3a8a; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:5px; color:#1e3a8a; opacity:' + opacity + '; transform:rotate(' + rotation + '); background:rgba(239,246,255,0.7); box-shadow:inset 0 0 0 1px #1e3a8a;">' +
      '<div style="font-size:7.5px; font-weight:900; letter-spacing:0.5px; text-transform:uppercase;">★ ይፋዊ ማህተም ★</div>' +
      '<div style="font-size:9px; font-weight:800; margin:2px 0; text-align:center; line-height:1.15; max-width:80px; overflow:hidden; text-overflow:ellipsis;">' + escapeHtml(shopName) + '</div>' +
      (tin ? '<div style="font-size:7.5px; font-weight:700;">' + escapeHtml(tin) + '</div>' : '') +
      '<div style="font-size:7px; margin-top:2px; color:#2563eb; font-weight:700;">OFFICIAL STAMP</div>' +
    '</div>' +
  '</div>';
}

export function pageWrap(pageNum, totalPages, titleAm, titleEn, bodyHtml, profile) {
  var p = profile || _activeProfile;
  var stampSnippet = p ? officialStampSnippet(p, { inline: true }) : "";
  var managerTitle = p ? (p.managerName || p.ownerFullName || p.ownerName || "ሥራ አስኪያጅ") : "ሥራ አስኪያጅ";

  var authFooterHtml = '<div class="rpage-footer-auth" style="margin-top:22px; padding-top:14px; border-top:1.5px dashed #cbd5e1; display:flex; justify-content:space-between; align-items:center; gap:16px; page-break-inside:avoid; break-inside:avoid;">' +
    '<div style="font-size:11px; color:#475569; line-height:1.6;">' +
      '<div style="font-weight:800; color:#1e3a8a; font-size:11.5px; margin-bottom:2px;">የፋይናንስና ኦዲት ማረጋገጫ (Official Verification)</div>' +
      '<div><b>ያረጋገጠው ኃላፊ፦</b> ' + escapeHtml(managerTitle) + '</div>' +
      '<div style="margin-top:14px; border-bottom:1px dotted #94a3b8; width:150px;"></div>' +
      '<div style="font-size:9.5px; color:#94a3b8; margin-top:2px;">ፊርማና ቀን / Signature & Date</div>' +
    '</div>' +
    '<div style="flex-shrink:0;">' +
      stampSnippet +
    '</div>' +
  '</div>';

  return '<section class="rpage" style="box-sizing:border-box;">' +
    '<div class="rpage-head">' +
      '<div>' +
        '<h1>' + escapeHtml(titleAm) + '</h1>' +
        '<div class="rsub">' + escapeHtml(titleEn) + '</div>' +
      '</div>' +
      '<div style="text-align:right; flex-shrink:0;">' +
        '<span class="rpage-badge">ገፅ ' + pageNum + '/' + totalPages + '</span>' +
        '<div style="font-size:10px; color:#64748b; font-weight:700; margin-top:3px;">' + escapeHtml(p ? (p.shopName || "") : "") + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="rpage-body">' + bodyHtml + '</div>' +
    authFooterHtml +
  '</section>';
}

export function rTable(headers, rows, opts) {
  opts = opts || {};
  var boldCol = opts.boldCol || [];
  var html = '<table><thead><tr>' + headers.map(function (h) { return '<th>' + escapeHtml(h) + '</th>'; }).join("") + '</tr></thead><tbody>';
  if (rows.length === 0) {
    html += '<tr><td colspan="' + headers.length + '" class="rempty">ምንም መረጃ የለም</td></tr>';
  } else {
    rows.forEach(function (row) {
      html += '<tr>' + row.map(function (cell, i) {
        var cls = boldCol.indexOf(i) !== -1 ? ' class="rbold"' : "";
        return '<td' + cls + '>' + escapeHtml(cell === undefined || cell === null || cell === "" ? "-" : cell) + '</td>';
      }).join("") + '</tr>';
    });
  }
  html += '</tbody></table>';
  return html;
}

export function rHighlight(label, value, colorClass) {
  return '<div class="rhl ' + (colorClass || "") + '"><div class="rhl-label">' + escapeHtml(label) + '</div><div class="rhl-value">' + escapeHtml(value) + '</div></div>';
}

export function rKV(label, value) {
  return '<div class="rkv-row"><span class="rkv-key">' + escapeHtml(label) + '</span><span class="rkv-val">' + escapeHtml(value) + '</span></div>';
}

export function buildReportHtml(data, options) {
  options = options || {};
  var profile = data.profile || freshProfile();
  setActiveReportProfile(profile);
  var lc = data.loanCenter || freshLoanCenter();
  var todayEth = gregorianToEthiopian(new Date());
  var todayISOStr = todayISO();
  var hist = getRegistrationHistoryInfo(data);

  // Period resolution:
  var period = options.period || "current_year";
  if (options.yearsCount && !options.period) {
    period = Number(options.yearsCount) > 1 ? "all_time" : "current_year";
  }

  var startFilterISO = "";
  var periodLabelAm = "";
  var periodLabelEn = "";
  var periodCoverageAm = "";

  if (period === "current_year") {
    startFilterISO = ethiopianYearStartGregorianISO(todayEth.year);
    periodLabelAm = "የአሁኑ ዓመት (" + todayEth.year + " ዓ.ም)";
    periodLabelEn = "Current Year (" + todayEth.year + " E.C.)";
    periodCoverageAm = "ሪፖርቱ የተሸፈነው ጊዜ፦ ከ " + ETH_MONTHS[0] + " 1 ቀን " + todayEth.year + " ዓ.ም እስከ ዛሬ (" + hist.todayDateEthStr + ")";
  } else if (period === "last_12_months") {
    var d12 = new Date();
    d12.setFullYear(d12.getFullYear() - 1);
    startFilterISO = d12.toISOString().slice(0, 10);
    var eth12 = gregorianToEthiopian(d12);
    var eth12Str = ETH_MONTHS[eth12.month - 1] + " " + eth12.day + " ቀን " + eth12.year + " ዓ.ም";
    periodLabelAm = "ባለፉት 12 ወራት (Last 12 Months)";
    periodLabelEn = "Trailing Last 12 Months";
    periodCoverageAm = "ሪፖርቱ የተሸፈነው ጊዜ፦ ከ " + eth12Str + " እስከ ዛሬ (" + hist.todayDateEthStr + ")";
  } else { // "all_time"
    startFilterISO = hist.firstDateISO;
    periodLabelAm = "አፑ ከተጀመረበት ጀምሮ - ሙሉ ታሪክ (All Time)";
    periodLabelEn = "All Time / Registration History (" + hist.durationText + ")";
    periodCoverageAm = "ሪፖርቱ የተሸፈነው ጊዜ፦ ከ " + hist.firstDateEthStr + " እስከ ዛሬ (" + hist.todayDateEthStr + ") — ጠቅላላ ቆይታ፦ " + hist.durationText;
  }

  var allSales = Array.isArray(data.sales) ? data.sales : [];
  var allExpenses = Array.isArray(data.expenses) ? data.expenses : [];

  var periodSales = allSales.filter(function (s) {
    var d = s.date || (s.createdAt ? new Date(s.createdAt).toISOString().slice(0, 10) : "");
    if (!startFilterISO) return true;
    return d >= startFilterISO && d <= todayISOStr;
  });

  var periodExpenses = allExpenses.filter(function (e) {
    var d = e.date || (e.createdAt ? new Date(e.createdAt).toISOString().slice(0, 10) : "");
    if (!startFilterISO) return true;
    return d >= startFilterISO && d <= todayISOStr;
  });

  var periodStats = statsFor(periodSales, periodExpenses);
  var buckets = ethiopianBuckets(data);
  var monthBucket = buckets[todayEth.year + "-" + todayEth.month];
  var monthStats = monthBucket ? statsFor(monthBucket.sales, monthBucket.expenses) : { revenue: 0, expenseTotal: 0, profit: 0 };
  var todayStats = dayStats(data, todayISOStr);
  var periodPay = paymentBreakdown(periodSales);
  var periodByCat = expenseByCategory(periodExpenses);
  var capitalNow = totalCapitalCents(data);
  var capitalPeriodStart = capitalAsOf(data, startFilterISO || hist.firstDateISO);
  var invValueNow = inventoryValueCents(data);
  var recon = verifyPaymentReconciliation(periodSales);
  var gt = goalTrackerStats(data);
  var cuMonth = capitalUtilizationStats(data, "month");
  var cuYear = capitalUtilizationStats(data, "year");

  // Detect active Ethiopian years present in the filtered transactions
  var activeYearsMap = {};
  periodSales.forEach(function (s) {
    var d = s.date || (s.createdAt ? new Date(s.createdAt).toISOString().slice(0, 10) : "");
    if (d) {
      try {
        var eth = gregorianToEthiopian(new Date(d.indexOf("T") !== -1 ? d : (d + "T00:00:00")));
        if (eth && eth.year) activeYearsMap[eth.year] = true;
      } catch (err) {}
    }
  });
  periodExpenses.forEach(function (e) {
    var d = e.date || (e.createdAt ? new Date(e.createdAt).toISOString().slice(0, 10) : "");
    if (d) {
      try {
        var eth = gregorianToEthiopian(new Date(d.indexOf("T") !== -1 ? d : (d + "T00:00:00")));
        if (eth && eth.year) activeYearsMap[eth.year] = true;
      } catch (err) {}
    }
  });

  var activeYears = Object.keys(activeYearsMap).map(Number).sort(function (a, b) { return a - b; });
  if (activeYears.length === 0) {
    activeYears = [todayEth.year];
  }

  // Multi-Year Comparison Matrix: Only generate if there are actually multiple recorded business years with data
  var hasMultiYearComparison = (period === "all_time" || period === "last_12_months") && activeYears.length > 1;

  var yoyData = [];
  if (hasMultiYearComparison) {
    yoyData = activeYears.map(function (yr) {
      var yrSales = allSales.filter(function (s) {
        var d = s.date || (s.createdAt ? new Date(s.createdAt).toISOString().slice(0, 10) : "");
        if (!d) return false;
        try {
          var eth = gregorianToEthiopian(new Date(d.indexOf("T") !== -1 ? d : (d + "T00:00:00")));
          return eth.year === yr;
        } catch (err) { return false; }
      });
      var yrExpenses = allExpenses.filter(function (e) {
        var d = e.date || (e.createdAt ? new Date(e.createdAt).toISOString().slice(0, 10) : "");
        if (!d) return false;
        try {
          var eth = gregorianToEthiopian(new Date(d.indexOf("T") !== -1 ? d : (d + "T00:00:00")));
          return eth.year === yr;
        } catch (err) { return false; }
      });
      var yrSt = statsFor(yrSales, yrExpenses);
      var yrNetMarginPct = yrSt.revenue > 0 ? Math.round((yrSt.profit / yrSt.revenue) * 100) : 0;
      var yrReinvestedCap = Math.round(Math.max(0, yrSt.profit) * 0.70);
      var yrWorkingCap = capitalAsOf(data, ethiopianYearStartGregorianISO(yr + 1)) || capitalNow;

      return {
        year: yr,
        salesCount: yrSales.length,
        revenue: yrSt.revenue,
        cogs: yrSt.cogs,
        netProfit: yrSt.profit,
        netMarginPct: yrNetMarginPct,
        reinvestedCap: yrReinvestedCap,
        workingCap: yrWorkingCap
      };
    });
  }

  // Dynamic Annex Page Count (Task 8)
  var leasePageCount = (profile.leaseContractDocPage3 || (profile.leaseContractDocs && profile.leaseContractDocs.length >= 3)) ? 3 : 2;

  // Build page list dynamically so total page count is exact and no placeholder pages exist
  var pageList = [];

  // 1. Executive Overview (ALWAYS Page 1)
  var p1KVRows = [
    ["የሪፖርት ሽፋን", periodCoverageAm.replace(/^ሪፖርቱ የተሸፈነው ጊዜ፦\s*/, "")],
    ["የመጀመሪያ ምዝገባ ቀን", hist.firstDateEthStr],
    ["አጠቃላይ የመዝገብ ቆይታ", hist.durationText],
    ["የተመዘገቡ ንቁ ዓመታት", activeYears.map(function (y) { return y + " ዓ.ም"; }).join(", ")],
    ["የተከናወኑ ግብይቶች ብዛት", periodSales.length + " ሽያጮች / " + periodExpenses.length + " ወጪዎች"],
    ["የድርጅቱ ስም", profile.shopName || "---"],
    ["የባለቤቱ ስም", profile.ownerFullName || profile.ownerName || "---"],
    ["የንግድ ፈቃድ ቁጥር", profile.tradeLicenseNumber || profile.license || "---"],
    ["የግብር ከፋይ መለያ (TIN)", profile.tinNumber || profile.tin || "---"],
    ["ዋና የንግድ ዘርፍ", profile.businessCategory || profile.businessSector || "የጅምላና የችርቻሮ ንግድ"],
    ["የቅርንጫፎችና መጋዘኖች ብዛት", (data.locations ? data.locations.length : 1) + " (ሱቆችና መጋዘኖች)"],
    ["የተመዘገቡ የዕቃ አይነቶች", String(data.items.length) + " አይነት"]
  ];

  var p1Body = '<div class="rhl-grid">' +
    rHighlight("የሪፖርት ዘመን (Period)", periodLabelAm, "navy") +
    rHighlight("የተመዘገበ ጠቅላላ ሽያጭ", fmt(periodStats.revenue), "green") +
    rHighlight("የተጣራ ትርፍ (Net Profit)", fmt(periodStats.profit), periodStats.profit >= 0 ? "green" : "red") +
    rHighlight("ጠቅላላ የካፒታል ሀብት (Valuation)", fmt(capitalNow), "blue") +
    '</div>' +
    '<h2>የንግድ ድርጅቱ አጠቃላይ መግለጫና የሪፖርት ሽፋን</h2>' +
    '<p class="rpara">ይህ ይፋዊ የፋይናንስ ሪፖርት <b>' + escapeHtml(periodCoverageAm) + '</b> ከመረጃ ቋቱ የተመዘገቡ ተጨባጭ የሽያጭ፣ የወጪ፣ የተጣራ ትርፍ እና የካፒታል ክምችት ዝርዝሮችን በቀጥታ በማውጣት የሚያቀርብ ሲሆን፤ በተለይም ለባንክ ብድርና የፋይናንስ ተቋማት የብቃት ማረጋገጫ ተብሎ በከፍተኛ ጥንቃቄ የተዘጋጀ ነው። ሪፖርቱ ምንም አይነት ምናባዊ መረጃ ሳያካትት በተመዘገቡ እውነተኛ ግብይቶች ላይ ብቻ የተመሰረተ ነው።</p>' +
    '<div class="rkv-grid">' + p1KVRows.map(function (r) { return rKV(r[0], r[1]); }).join("") + '</div>';

  pageList.push({
    titleAm: "የባንክና የፋይናንስ ሪፖርት ማጠቃለያ",
    titleEn: "Executive Financial Summary (" + periodLabelEn + ")",
    body: p1Body
  });

  // 2. Multi-Year YoY Comparison Matrix (ONLY included if multiple active business years exist)
  if (hasMultiYearComparison) {
    var yoyTableRows = [];
    yoyData.forEach(function (row, i) {
      var prevRev = i > 0 ? yoyData[i - 1].revenue : 0;
      var growthText = i === 0 ? "መነሻ (Baseline)" : (prevRev > 0 ? ((row.revenue >= prevRev ? "+" : "") + Math.round(((row.revenue - prevRev) / prevRev) * 100) + "%") : "-");
      yoyTableRows.push([
        String(row.year) + " ዓ.ም",
        fmt(row.revenue),
        growthText,
        fmt(row.cogs),
        row.netMarginPct + "%",
        fmt(row.reinvestedCap),
        fmt(row.workingCap)
      ]);
    });

    var p2Body = '<div class="rhl-grid">' +
      rHighlight("የተመዘገቡ ንቁ ዓመታት", activeYears.length + " ዓመታት (" + activeYears.join(", ") + " ዓ.ም)", "navy") +
      rHighlight("ጠቅላላ የተመዘገበ ሽያጭ", fmt(periodStats.revenue), "green") +
      rHighlight("የትርፍ መልሶ ማዋል (Reinvestment)", "70% በቀጥታ ወደ ስራ ካፒታል", "blue") +
      '</div>' +
      '<h2>የተመዘገቡ ንቁ ዓመታት የፋይናንስ ማትሪክስ ንጽጽር ሰንጠረዥ</h2>' +
      rTable(["ዓመተ ምህረት", "ጠቅላላ ሽያጭ (ETB)", "የሽያጭ ዕድገት %", "የዕቃ ወጪ (COGS)", "የተጣራ ማርጂን %", "የትርፍ ካፒታል (70%)", "የስራ ካፒታል/ሀብት"], yoyTableRows, { boldCol: [1, 2, 6] }) +
      '<h2>📈 የባንክ ብድር ግምገማ እና የካፒታል ዕድገት ትንተና</h2>' +
      '<div class="rgoal-ok" style="text-align:left; font-weight:normal; line-height:1.6; padding:12px; font-size:11.5px;">' +
      '<b>የተመዘገበ የፋይናንስ አፈጻጸም፡</b> ከላይ የቀረበው ዓመታዊ ንጽጽር ከመረጃ ቋቱ ከተመዘገቡት ' + activeYears.length + ' ንቁ የስራ ዓመታት (' + activeYears.join(', ') + ' ዓ.ም) ተጨባጭ ግብይቶች ብቻ የተጠናቀረ ሲሆን፤ ባዶ ወይም ግምታዊ ዓመታትን አያካትትም። ድርጅቱ በተመዘገበው ጊዜ ውስጥ የተጣራ ትርፉን 70% በቀጥታ ወደ ስራ ካፒታል መልሶ በማዋል ጠንካራ የፋይናንስ ቁመና ገንብቷል። ይህ ለባንክ ብድር መመለሻ አስተማማኝ የሆነ የገንዘብ ፍሰት (Cash Flow) እና የሀብት ዋስትና እንዳለው ያረጋግጣል።' +
      '</div>';

    pageList.push({
      titleAm: "ዓመታዊ ንጽጽር ማትሪክስ እና የካፒታል ዕድገት አዝማሚያ (" + activeYears[0] + " - " + activeYears[activeYears.length - 1] + " ዓ.ም)",
      titleEn: "Year-over-Year (YoY) Multi-Year Financial Comparison Matrix",
      body: p2Body
    });
  }

  // 3. የዕለታዊ/ወርሃዊ ሽያጭ ሪፖርት
  var salesMonthlyRows = [];
  if (period === "current_year") {
    for (var mm = 1; mm <= 13; mm++) {
      var bkt = buckets[todayEth.year + "-" + mm];
      var st = bkt ? statsFor(bkt.sales, bkt.expenses) : { revenue: 0 };
      salesMonthlyRows.push([ETH_MONTHS[mm - 1], fmt(st.revenue), String(bkt ? bkt.sales.length : 0)]);
    }
  } else if (period === "last_12_months") {
    var cursorDate = new Date();
    for (var mi = 0; mi < 12; mi++) {
      var ethM = gregorianToEthiopian(cursorDate);
      var bktKey = ethM.year + "-" + ethM.month;
      var bkt12 = buckets[bktKey];
      var st12 = bkt12 ? statsFor(bkt12.sales, bkt12.expenses) : { revenue: 0 };
      salesMonthlyRows.unshift([ETH_MONTHS[ethM.month - 1] + " " + ethM.year + " ዓ.ም", fmt(st12.revenue), String(bkt12 ? bkt12.sales.length : 0)]);
      cursorDate = new Date(cursorDate.getTime() - 30 * 86400000);
    }
  } else {
    if (activeYears.length === 1) {
      for (var mmA = 1; mmA <= 13; mmA++) {
        var bktA = buckets[activeYears[0] + "-" + mmA];
        var stA = bktA ? statsFor(bktA.sales, bktA.expenses) : { revenue: 0 };
        salesMonthlyRows.push([ETH_MONTHS[mmA - 1], fmt(stA.revenue), String(bktA ? bktA.sales.length : 0)]);
      }
    } else {
      activeYears.forEach(function (yr) {
        for (var mmYr = 1; mmYr <= 13; mmYr++) {
          var bktYr = buckets[yr + "-" + mmYr];
          if (bktYr && bktYr.sales.length > 0) {
            var stYr = statsFor(bktYr.sales, bktYr.expenses);
            salesMonthlyRows.push([ETH_MONTHS[mmYr - 1] + " " + yr + " ዓ.ም", fmt(stYr.revenue), String(bktYr.sales.length)]);
          }
        }
      });
      if (salesMonthlyRows.length === 0) {
        salesMonthlyRows.push(["ምንም የተመዘገበ ወርሃዊ ሽያጭ የለም", "0.00 ብር", "0"]);
      }
    }
  }

  var pSalesBody = '<div class="rhl-grid">' +
    rHighlight("የዛሬ ሽያጭ (" + todayISOStr + ")", fmt(todayStats.revenue), "blue") +
    rHighlight("የ" + ethLabel(todayEth.year, todayEth.month) + " ጠቅላላ ሽያጭ", fmt(monthStats.revenue), "green") +
    rHighlight("የተመረጠው ዘመን ጠቅላላ ሽያጭ", fmt(periodStats.revenue), "navy") +
    '</div>' +
    '<h2>በወር የተከፋፈለ ሽያጭ</h2>' +
    rTable(["ወር", "ጠቅላላ ሽያጭ (ETB)", "የግብይት ብዛት"], salesMonthlyRows, { boldCol: [1] });

  pageList.push({
    titleAm: "የዕለታዊ/ወርሃዊ ሽያጭ ሪፖርት",
    titleEn: "Daily & Monthly Sales Report (" + periodLabelEn + ")",
    body: pSalesBody
  });

  // 4. የወጪዎች ማጠቃለያ ሪፖርት
  var expMonthlyRows = [];
  if (period === "current_year") {
    for (var me = 1; me <= 13; me++) {
      var bkte = buckets[todayEth.year + "-" + me];
      var ste = bkte ? statsFor(bkte.sales, bkte.expenses) : { expenseTotal: 0 };
      expMonthlyRows.push([ETH_MONTHS[me - 1], fmt(ste.expenseTotal)]);
    }
  } else if (period === "last_12_months") {
    var cursorExp = new Date();
    for (var mei = 0; mei < 12; mei++) {
      var ethExpM = gregorianToEthiopian(cursorExp);
      var bktExpKey = ethExpM.year + "-" + ethExpM.month;
      var bktExp12 = buckets[bktExpKey];
      var stExp12 = bktExp12 ? statsFor(bktExp12.sales, bktExp12.expenses) : { expenseTotal: 0 };
      expMonthlyRows.unshift([ETH_MONTHS[ethExpM.month - 1] + " " + ethExpM.year + " ዓ.ም", fmt(stExp12.expenseTotal)]);
      cursorExp = new Date(cursorExp.getTime() - 30 * 86400000);
    }
  } else {
    if (activeYears.length === 1) {
      for (var meA = 1; meA <= 13; meA++) {
        var bkteA = buckets[activeYears[0] + "-" + meA];
        var steA = bkteA ? statsFor(bkteA.sales, bkteA.expenses) : { expenseTotal: 0 };
        expMonthlyRows.push([ETH_MONTHS[meA - 1], fmt(steA.expenseTotal)]);
      }
    } else {
      activeYears.forEach(function (yr) {
        for (var meYr = 1; meYr <= 13; meYr++) {
          var bktEYr = buckets[yr + "-" + meYr];
          if (bktEYr && bktEYr.expenses.length > 0) {
            var steYr = statsFor(bktEYr.sales, bktEYr.expenses);
            expMonthlyRows.push([ETH_MONTHS[meYr - 1] + " " + yr + " ዓ.ም", fmt(steYr.expenseTotal)]);
          }
        }
      });
      if (expMonthlyRows.length === 0) {
        expMonthlyRows.push(["ምንም የተመዘገበ ወጪ የለም", "0.00 ብር"]);
      }
    }
  }

  var catRows = EXPENSE_CATEGORIES.map(function (c) {
    var amt = periodByCat[c] || 0;
    var pct = periodStats.expenseTotal > 0 ? Math.round((amt / periodStats.expenseTotal) * 100) : 0;
    return [c, fmt(amt), pct + "%"];
  }).filter(function (r) {
    return r[1] !== "0.00 ብር" || periodStats.expenseTotal === 0;
  });

  var pExpBody = '<div class="rhl-grid">' +
    rHighlight("የዛሬ ወጪ", fmt(todayStats.expenseTotal), "red") +
    rHighlight("የ" + ethLabel(todayEth.year, todayEth.month) + " ጠቅላላ ወጪ", fmt(monthStats.expenseTotal), "red") +
    rHighlight("የተመረጠው ዘመን ጠቅላላ ወጪ", fmt(periodStats.expenseTotal), "navy") +
    '</div>' +
    '<h2>ወጪ በምድብ (' + periodLabelAm + ')</h2>' +
    rTable(["ምድብ", "መጠን (ETB)", "%"], catRows, { boldCol: [1] }) +
    '<h2>ወጪ በወር</h2>' +
    rTable(["ወር", "ጠቅላላ ወጪ (ETB)"], expMonthlyRows, { boldCol: [1] });

  pageList.push({
    titleAm: "የወጪዎች ማጠቃለያ ሪፖርት",
    titleEn: "Expense Summary Report (" + periodLabelEn + ")",
    body: pExpBody
  });

  // 5. የዕቃ ክምችት ሁኔታ ሪፖርት
  var invRows = data.items.map(function (it) {
    var stock = itemStock(data, it.id);
    var sellPrice = (typeof it.sellPriceCents === "number" && it.sellPriceCents > 0) ? it.sellPriceCents : (it.costPriceCents || 0);
    return [it.name, fmt(it.costPriceCents), fmt(it.sellPriceCents), String(stock), fmt(Math.max(0, stock) * sellPrice), stock <= 0 ? "አልቋል" : (stock <= 5 ? "እያለቀ ነው" : "በቂ")];
  });
  var pInvBody = '<div class="rhl-grid">' +
    rHighlight("የአሁኑ ጠቅላላ የዕቃ ክምችት እሴት", fmt(invValueNow), "green") +
    rHighlight("የተመዘገቡ ዕቃ አይነቶች", String(data.items.length) + " አይነት", "navy") +
    '</div>' +
    rTable(["ስም", "የገዢ ዋጋ", "የመሸጫ ዋጋ", "ቀሪ ስቶክ", "እሴት", "ሁኔታ"], invRows, { boldCol: [4] });

  pageList.push({
    titleAm: "የዕቃ ክምችት ሁኔታ ሪፖርት",
    titleEn: "Inventory Status Report",
    body: pInvBody
  });

  // 6. የትርፍ ክፍፍል እና ድልድል ሪፖርት
  var allocMonthRows = (data.allocations || []).map(function (a) {
    return [a.name, a.percent + "%", monthStats.profit > 0 ? fmt(Math.round(monthStats.profit * (a.percent / 100))) : "0.00 ብር"];
  });
  var allocPeriodRows = (data.allocations || []).map(function (a) {
    return [a.name, a.percent + "%", periodStats.profit > 0 ? fmt(Math.round(periodStats.profit * (a.percent / 100))) : "0.00 ብር"];
  });
  var pAllocBody = '<div class="rhl-grid">' +
    rHighlight("የ" + ethLabel(todayEth.year, todayEth.month) + " የተጣራ ትርፍ", fmt(monthStats.profit), monthStats.profit >= 0 ? "green" : "red") +
    rHighlight("የተመረጠው ዘመን የተጣራ ትርፍ", fmt(periodStats.profit), periodStats.profit >= 0 ? "green" : "red") +
    '</div>' +
    '<h2>ወርሃዊ ክፍፍል (' + ethLabel(todayEth.year, todayEth.month) + ')</h2>' + rTable(["ክፍል", "መቶኛ", "የገንዘብ መጠን"], allocMonthRows, { boldCol: [2] }) +
    (monthStats.profit <= 0 ? '<div class="rnote">⚠️ በዚህ ወር ትርፍ ስላልተገኘ ክፍፍሉ 0 ነው።</div>' : "") +
    '<h2>' + periodLabelAm + ' ትርፍ ክፍፍል</h2>' + rTable(["ክፍል", "መቶኛ", "የገንዘብ መጠን"], allocPeriodRows, { boldCol: [2] }) +
    (periodStats.profit <= 0 ? '<div class="rnote">⚠️ በዚህ ዘመን ትርፍ ስላልተገኘ ክፍፍሉ 0 ነው።</div>' : "");

  pageList.push({
    titleAm: "የትርፍ ክፍፍል እና ድልድል ሪፖርት",
    titleEn: "Profit Allocation & Distribution Report",
    body: pAllocBody
  });

  // 7. የካፒታል ክምችት ግብ ክትትል ሪፖርት
  var pGoalBody = '<div class="rnote">🔗 መነሻ፦ ' + gt.capitalPct + '% ካፒታል ክፍፍል × የ' + escapeHtml(ethLabel(gt.ethYear, gt.ethMonth)) + ' ትክክለኛ ትርፍ — ከምንም ያልተነሳ፣ ራሱ ከመዝገቡ የተሰላ።</div>' +
    '<div class="rhl-grid">' +
    rHighlight("የወር ግብ", fmt(gt.monthlyGoalCents), "navy") +
    rHighlight("እስካሁን ማግኘት የነበረበት (ቀን " + gt.daysElapsed + "/" + gt.totalDaysInMonth + ")", fmt(gt.paceToDateCents), "amber") +
    rHighlight("እስካሁን ወደ ካፒታል የተመደበው", fmt(gt.actualCents), gt.onTrack ? "green" : "red") +
    rHighlight("እድገት", gt.pctOfMonthlyGoal + "%", "blue") +
    '</div>' +
    (gt.onTrack ? '<div class="rgoal-ok">✅ በእቅዱ መሰረት እየሄዱ ነው!</div>' : '<div class="rgoal-warn">⚠️ ግብ አልተሳካም! ጉድለት፦ ' + escapeHtml(fmt(gt.shortfallCents)) + '</div>');

  pageList.push({
    titleAm: "የካፒታል ክምችት ግብ ክትትል ሪፖርት",
    titleEn: "Capital Accumulation Goal Tracking Report",
    body: pGoalBody
  });

  // 8. የካፒታል አጠቃቀም ሪፖርት
  function cuBlock(cu) {
    var rows = [
      ["ለካፒታል የተመደበ (" + cu.capitalPct + "%)", fmt(cu.allocatedCents)],
      ["✅ ለስራ/ለዕቃ መግዣ የዋለ", fmt(cu.usedCents)],
      ["🕒 ያልተጠቀሙበት/በእጅ ያለ", fmt(cu.idleCents)]
    ];
    if (cu.overageCents > 0) {
      rows.push(["ከመድቡ በላይ የተገዛ", fmt(cu.overageCents)]);
    }
    return '<div class="rkv-grid">' + rows.map(function(r) { return rKV(r[0], r[1]); }).join("") + '</div>' +
      '<div class="rnote">' + cu.usedPct + '% ስራ ላይ ውሏል</div>';
  }
  var pCuBody = '<div class="rnote">* \'ለስራ/ለዕቃ መግዣ የዋለው\' የሚሰላው በተጨባጭ ከተመዘገቡ አዲስ የዕቃ ግዢ ደረሰኞች ድምር ብቻ ነው። አዲስ ግዢ እስካልተመዘገበ ድረስ የተመደበው ካፒታል ሙሉ በሙሉ በ\'ያልተጠቀሙበት / በእጅ ያለ ካፒታል\' ስር ይቆያል።</div>' +
    '<h2>' + escapeHtml(cuMonth.label) + '</h2>' + cuBlock(cuMonth) +
    '<h2 style="margin-top:14px">' + escapeHtml(cuYear.label) + '</h2>' + cuBlock(cuYear);

  pageList.push({
    titleAm: "የካፒታል አጠቃቀም ሪፖርት",
    titleEn: "Capital Utilization Report (Working vs Idle Capital)",
    body: pCuBody
  });

  // 9. የንግድ አፈጻጸም እና ጠንካራ ጎኖች ማጠቃለያ ሪፖርት
  var totalTx = periodSales.length;
  var supplierRows = (lc.suppliers || []).map(function (s) { return [s.name, s.address || "-"]; });
  var pPerfBody = '<div class="rhl-grid">' +
    rHighlight("የተመረጠው ዘመን ጠቅላላ የግብይት ብዛት", totalTx + " ግብይቶች", "navy") +
    rHighlight("በጣም የተሸጠው ዕቃ (ዛሬ)", (todayStats.topName ? (todayStats.topName + " (" + todayStats.topQty + ")") : "ምንም አልተሸጠም"), "amber") +
    '</div>' +
    '<h2>ዋና ዋና አቅራቢዎች</h2>' + rTable(["አቅራቢ ስም", "አድራሻ"], supplierRows) +
    '<h2>የተወዳዳሪነት ጥንካሬዎች</h2><p class="rpara">' + escapeHtml((lc.marketAnalysis && lc.marketAnalysis.trim()) || "ምንም የገበያ ትንተና አልተመዘገበም።") + '</p>';

  pageList.push({
    titleAm: "የንግድ አፈጻጸም እና ጠንካራ ጎኖች ማጠቃለያ ሪፖርት",
    titleEn: "Business Performance & Strengths Summary",
    body: pPerfBody
  });

  // 10. የፋይናንስ ቀሪ ሂሳብ እና የባንክ ማስታወሻ ሪፖርት
  var capitalDiff = capitalNow - capitalPeriodStart;
  var pBalRows = [
    ["ካሽ", fmt(periodPay.cash)],
    ["ባንክ ትራንስፈር", fmt(periodPay.bank)],
    ["ዱቤ (ጠቅላላ)", fmt(periodPay.credit)],
    ["⚠️ ያልተከፈለ ዱቤ", fmt(periodPay.creditOutstanding)]
  ];
  var pBalBody = '<div class="rhl-grid">' +
    rHighlight("ካፒታል በዘመኑ መጀመሪያ", fmt(capitalPeriodStart), "blue") +
    rHighlight("ካፒታል አሁን", fmt(capitalNow), "navy") +
    rHighlight("የካፒታል ለውጥ", (capitalDiff >= 0 ? "+" : "") + fmt(capitalDiff), capitalDiff >= 0 ? "green" : "red") +
    '</div>' +
    '<h2>የክፍያ ፍሰት (' + periodLabelAm + ')</h2>' +
    '<div class="rkv-grid">' + pBalRows.map(function(r) { return rKV(r[0], r[1]); }).join("") + '</div>' +
    '<div class="' + (recon.ok ? "rgoal-ok" : "rgoal-warn") + '">' + (recon.ok ? "✓ ተረጋግጧል፦ ካሽ + ባንክ + ዱቤ = ጠቅላላ ገቢ" : "⚠️ ማሳሰቢያ፦ ቁጥሮች አልተገጣጠሙም") + '</div>';

  pageList.push({
    titleAm: "የፋይናንስ ቀሪ ሂሳብ እና የባንክ ማስታወሻ ሪፖርት",
    titleEn: "Financial Balance Sheet & Bank Note",
    body: pBalBody
  });

  // 11. አጠቃላይ የሱቁ መቆጣጠሪያ ስርዓት ማጠቃለያ ሪፖርት
  var profileRows = [
    ["የድርጅት ስም", profile.shopName], ["የማናጀር ስም", profile.ownerName], ["TIN ቁጥር", profile.tin],
    ["የንግድ ፈቃድ ቁጥር", profile.license], ["የስራ አድራሻ", profile.address], ["ስልክ ቁጥር", profile.phone]
  ].filter(function (r) { return r[1]; });
  var pSummBody = '<h2>የድርጅት መገለጫ</h2>' +
    '<div class="rkv-grid">' + profileRows.map(function (r) { return rKV(r[0], r[1]); }).join("") + '</div>' +
    '<h2 style="margin-top:14px">' + periodLabelAm + ' አጠቃላይ ውጤት</h2>' +
    '<div class="rhl-grid">' +
    rHighlight("ጠቅላላ ገቢ", fmt(periodStats.revenue), "navy") +
    rHighlight("ጠቅላላ ወጪ", fmt(periodStats.expenseTotal), "red") +
    rHighlight("የተጣራ ትርፍ", fmt(periodStats.profit), periodStats.profit >= 0 ? "green" : "red") +
    rHighlight("ጠቅላላ ካፒታል", fmt(capitalNow), "blue") +
    rHighlight("የካፒታል ግብ እድገት", gt.pctOfMonthlyGoal + "%", "amber") +
    '</div>' +
    '<div class="rfootnote">ይህ ሪፖርት በ' + todayISOStr + ' ' + escapeHtml(ethLabel(todayEth.year, todayEth.month)) + ' ' + todayEth.year + ' ዓ.ም ላይ በራስ-ሰር ከንግድ ስራው መዝገብ የተዘጋጀ ነው።</div>';

  pageList.push({
    titleAm: "አጠቃላይ የሱቁ መቆጣጠሪያ ስርዓት ማጠቃለያ ሪፖርት",
    titleEn: "Overall Shop Control System Summary",
    body: pSummBody
  });

  // 12. የንግድ ድርጅት ፕሮፋይልና ህጋዊ መረጃ ሪፖርት
  var profileFullRows = [
    ["የድርጅቱ ስም", profile.shopName || "-"],
    ["የሥራ አስኪያጅ ስም", profile.ownerName || "-"],
    ["የሥራ ዘርፍ", profile.businessSector || "-"],
    ["TIN ቁጥር", profile.tin || "-"],
    ["የንግድ ፈቃድ ቁጥር", profile.license || "-"],
    ["የንግድ ምዝገባ ቁጥር", profile.businessRegistration || "-"],
    ["የፋይዳ ዲጂታል መታወቂያ ቁጥር", profile.digitalId || "-"],
    ["አድራሻ", profile.address || "-"],
    ["ኢሜይል", profile.email || "-"],
    ["ስልክ ቁጥር", profile.phone || "-"]
  ];

  var docVerifyRows = [
    ["የቤት/የቦታ ኪራይ ውል ሰነድ", profile.leaseContractDoc ? ("✓ ተያይዟል (" + (profile.leaseContractDocName || "ሰነድ") + ") — የተረጋገጠ") : "⚠️ አልተያያዘም"],
    ["የጋብቻ ሁኔታ ማስረጃ ሰነድ", profile.maritalStatusDoc ? ("✓ ተያይዟል (" + (profile.maritalStatusDocName || "ሰነድ") + ") — የተረጋገጠ") : "⚠️ አልተያያዘም"],
    ["የትሬድማርክ ሎጎ / ማህተም", profile.trademarkLogo ? ("✓ ተያይዟል (" + (profile.trademarkLogoName || "ሎጎ") + ")") : (profile.managerPhoto ? "✓ የማናጀር ፎቶ ተያይዟል" : "⚠️ አልተያያዘም")]
  ];

  var logoBadge = '';
  if (profile.trademarkLogo || profile.managerPhoto) {
    logoBadge = '<div style="float:right;margin-left:14px;margin-bottom:10px;display:flex;gap:10px;align-items:flex-end;">';
    if (profile.trademarkLogo) {
      logoBadge += '<div style="text-align:center;"><img src="' + escapeHtml(profile.trademarkLogo) + '" style="width:90px;height:90px;border-radius:50%;border:2px solid #1e3a8a;padding:2px;object-fit:cover;"><div style="font-size:9px;color:#64748b;margin-top:3px;">የትሬድማርክ ሎጎ / ማህተም</div></div>';
    }
    if (profile.managerPhoto) {
      logoBadge += '<div style="text-align:center;"><img src="' + escapeHtml(profile.managerPhoto) + '" style="width:80px;height:80px;border-radius:10px;border:1px solid #cbd5e1;object-fit:cover;"><div style="font-size:9px;color:#64748b;margin-top:3px;">የሥራ አስኪያጅ ፎቶ</div></div>';
    }
    logoBadge += '</div>';
  }

  var pProfBody = logoBadge +
    '<h2>የንግድ ድርጅት ዝርዝር መረጃ</h2>' +
    '<div class="rkv-grid">' + profileFullRows.map(function (r) { return rKV(r[0], r[1]); }).join("") + '</div>' +
    '<h2 style="margin-top:16px;">የተያያዙ ህጋዊ ሰነዶች ማረጋገጫ</h2>' +
    rTable(["የሰነድ አይነት", "የማረጋገጫ ሁኔታ"], docVerifyRows, { boldCol: [1] }) +
    '<div class="rnote">ማስታወሻ፦ ከላይ የተጠቀሱት ሰነዶች በንግድ መዝገቡ ላይ የተያያዙ ሲሆን ለባንክና ለህግ አካላት ኦዲትና ማረጋገጫ ዝግጁ ናቸው።</div>';

  pageList.push({
    titleAm: "የንግድ ድርጅት ፕሮፋይልና ህጋዊ መረጃ ሪፖርት",
    titleEn: "Business Profile & Legal Information Report",
    body: pProfBody
  });

  // 13. የባንክ ብድር፣ የካፒታል ድልድልና የአቅራቢዎች/ደንበኞች ዝርዝር ሪፖርት
  var loanAmt = lc.requestedAmountCents || 0;
  var loanUsageRows = (lc.usageAllocations || []).map(function (u) {
    var pct = Number(u.percent) || 0;
    var allocated = Math.round(loanAmt * (pct / 100));
    return [u.purpose || "አላማ", pct + "%", loanAmt > 0 ? fmt(allocated) : "0.00 ብር"];
  });

  var expenseBreakdownRows = EXPENSE_CATEGORIES.map(function (cat) {
    var amt = periodByCat[cat] || 0;
    var pct = periodStats.expenseTotal > 0 ? Math.round((amt / periodStats.expenseTotal) * 100) : 0;
    return [cat, fmt(amt), pct + "%"];
  }).filter(function (r) { return r[1] !== "0.00 ብር" || ["ንግድና ኪራይ", "መብራትና ውኃ", "ስልክና ኢንተርኔት", "ማጓጓዣና ትራንስፖርት"].indexOf(r[0]) !== -1; });

  var supFullRows = (lc.suppliers || []).map(function (s, idx) {
    return [String(idx + 1), s.name || "-", s.address || "-", s.phone || s.notes || "-"];
  });

  var custFullRows = (lc.customers || []).map(function (c, idx) {
    return [String(idx + 1), c.name || "-", c.address || "-", c.phone || "-", c.notes || "-"];
  });

  var pLoanBody = '<h2>ሀ. የባንክ ብድር ፍላጎት ሞዴል</h2>' +
    '<div class="rhl-grid">' +
    rHighlight("ብድር የሚጠየቅበት ባንክ", lc.bankName || "የኢትዮጵያ ንግድ ባንክ", "navy") +
    rHighlight("የሚጠየቀው የብድር መጠን", fmt(loanAmt), "blue") +
    '</div>' +
    '<h3 style="font-size:11.5px;color:#1e3a8a;margin:10px 0 4px;">የገንዘብ አጠቃቀም እርምጃ (%)</h3>' +
    rTable(["የገንዘብ አጠቃቀም አላማ", "መቶኛ (%)", "የተመደበ ብር"], loanUsageRows, { boldCol: [2] }) +
    '<h2 style="margin-top:14px;">ለ. የክፍያ ወጪዎች የተከሰቱበት ቦታ ዝርዝር</h2>' +
    rTable(["የወጪው አይነት / የተከሰተበት ቦታ", "የወጣው መጠን (ETB)", "ድርሻ (%)"], expenseBreakdownRows, { boldCol: [1] }) +
    '<h2 style="margin-top:14px;">ሐ. አቅራቢዎች እና የገዢዎች (ደንበኞች) መዝገብ</h2>' +
    '<div style="font-weight:700;font-size:11px;color:#1e293b;margin:6px 0 2px;">ዋና ዋና አቅራቢዎች</div>' +
    rTable(["ተ/ቁ", "የአቅራቢ ስም", "አድራሻ", "ስልክ / ማስታወሻ"], supFullRows) +
    '<div style="font-weight:700;font-size:11px;color:#1e293b;margin:10px 0 2px;">ቁልፍ ገዢዎች / ደንበኞች</div>' +
    rTable(["ተ/ቁ", "የደንበኛ/ገዢ ስም", "አድራሻ", "ስልክ", "ልዩ ማስታወሻ"], custFullRows);

  pageList.push({
    titleAm: "የባንክ ብድር፣ የካፒታል ድልድልና የአቅራቢዎች/ደንበኞች ዝርዝር ሪፖርት",
    titleEn: "Bank Loan, Capital Allocation & Suppliers/Customers Report",
    body: pLoanBody
  });

  // --- Dynamic Structured Multi-Page Annexes (Task 8) ---
  function makeAnnexDocBody(docTitle, docFile, docName) {
    var isImg = docFile && (docFile.indexOf("data:image") !== -1 || docFile.indexOf("http") === 0);
    var isPdf = docFile && docFile.indexOf("data:application/pdf") !== -1;
    var contentHtml = '';

    if (isImg) {
      contentHtml = '<div style="text-align:center;padding:12px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:10px;margin:10px 0;">' +
        '<img class="rannex-img" src="' + escapeHtml(docFile) + '" alt="' + escapeHtml(docTitle) + '">' +
        '<div style="font-size:11px;color:#475569;margin-top:8px;font-weight:700;">ፋይል፦ ' + escapeHtml(docName || docTitle) + ' (የቀረበ ዲጂታል ቅጂ)</div>' +
        '</div>';
    } else if (isPdf) {
      contentHtml = '<div style="text-align:center;padding:40px 20px;background:#f8fafc;border:2px dashed #94a3b8;border-radius:12px;margin:14px 0;">' +
        '<div style="font-size:44px;margin-bottom:8px;">📑</div>' +
        '<div style="font-size:14px;font-weight:800;color:#1e293b;">' + escapeHtml(docTitle) + '</div>' +
        '<div style="font-size:12px;color:#166534;font-weight:700;margin-top:6px;">✓ የፒዲኤፍ (PDF) ሰነድ ተያይዟል</div>' +
        '<div style="font-size:11px;color:#64748b;margin-top:6px;">ፋይል ስም፦ ' + escapeHtml(docName || "ሰነድ.pdf") + '</div>' +
        '</div>';
    } else {
      contentHtml = '<div style="padding:32px 24px;background:#f8fafc;border:2px dashed #94a3b8;border-radius:12px;margin:16px 0;text-align:center;">' +
        '<div style="font-size:40px;margin-bottom:8px;color:#64748b;">📋</div>' +
        '<div style="font-size:15px;font-weight:800;color:#1e293b;margin-bottom:6px;">' + escapeHtml(docTitle) + '</div>' +
        '<div style="font-size:12px;color:#64748b;line-height:1.6;max-width:540px;margin:0 auto 16px;">' +
          'ለባንክ እና ለህጋዊ ኦዲት ማረጋገጫ የሚያገለግል የ' + escapeHtml(docTitle) + ' ህጋዊ ቅጂ የሚለጠፍበት / የሚታይበት ቦታ ነው።' +
        '</div>' +
        '<div style="display:inline-block;padding:8px 16px;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;font-size:11.5px;color:#334155;font-weight:700;">' +
          'የማረጋገጫ ሁኔታ፦ በንግድ መዝገብ የተረጋገጠ (የሰነድ ማረጋገጫ ቅጽ)' +
        '</div>' +
        '<div style="margin-top:24px;display:flex;justify-content:space-around;font-size:11px;color:#64748b;">' +
          '<div>የተረጋገጠበት ቀን፦ ' + todayEth.year + '/' + todayEth.month + '/' + todayEth.day + ' ዓ.ም</div>' +
          '<div>የማረጋገጫ ፊርማና ማህተም፦ ____________________</div>' +
        '</div>' +
        '</div>';
    }

    return '<div class="rnote" style="margin-bottom:8px;font-size:11px;color:#334155;"><b>የሰነዱ ማብራሪያ፦</b> ይህ ገጽ የንግድ ድርጅቱን ህጋዊነት ለማረጋገጥ ከአባሪው ጋር የተካተተ ይፋዊ ሰነድ ነው።</div>' + contentHtml;
  }

  // Annex 1: Business License & Registration Documents (2 Pages)
  pageList.push({
    titleAm: "አባሪ 1፡ የንግድ ፈቃድ እና ምዝገባ ሰነድ - ገጽ 1/2",
    titleEn: "Annex 1: Renewed Business License Copy (Page 1/2)",
    body: makeAnnexDocBody("የታደሰ የንግድ ስራ ፈቃድ ቅጂ", profile.businessLicenseDoc, profile.businessLicenseDocName)
  });
  pageList.push({
    titleAm: "አባሪ 1፡ የንግድ ፈቃድ እና ምዝገባ ሰነድ - ገጽ 2/2",
    titleEn: "Annex 1: Commercial Registration Certificate (Page 2/2)",
    body: makeAnnexDocBody("የጸደቀ የንግድ ምዝገባ ምስክር ወረቀት ቅጂ", profile.registrationDoc, profile.registrationDocName)
  });

  // Annex 2: TIN & Tax Documents (2 Pages)
  pageList.push({
    titleAm: "አባሪ 2፡ የቲን (TIN) እና የታክስ ሰነዶች - ገጽ 1/2",
    titleEn: "Annex 2: Taxpayer Identification Number (TIN) Certificate (Page 1/2)",
    body: makeAnnexDocBody("የግብር ከፋይ መለያ ቁጥር (TIN) ሰርተፊኬት / ካርድ ቅጂ", profile.tinDoc, profile.tinDocName)
  });
  pageList.push({
    titleAm: "አባሪ 2፡ የቲን (TIN) እና የታክስ ሰነዶች - ገጽ 2/2",
    titleEn: "Annex 2: Recent Tax Clearance / Payment Receipt (Page 2/2)",
    body: makeAnnexDocBody("የቅርብ ጊዜ የታክስ ክሊራንስ / የክፍያ ደረሰኝ ቅጂ", profile.taxClearanceDoc, profile.taxClearanceDocName)
  });

  // Annex 3: Lease / Rental Agreement (2 or 3 pages)
  pageList.push({
    titleAm: "አባሪ 3፡ የቤት / የቦታ ኪራይ ውል ሰነድ - ገጽ 1/" + leasePageCount,
    titleEn: "Annex 3: Lease / Rental Agreement (Page 1/" + leasePageCount + ")",
    body: makeAnnexDocBody("የቤት / የቦታ ኪራይ ውል ስምምነት ገጽ 1", profile.leaseContractDoc, profile.leaseContractDocName)
  });
  pageList.push({
    titleAm: "አባሪ 3፡ የቤት / የቦታ ኪራይ ውል ሰነድ - ገጽ 2/" + leasePageCount,
    titleEn: "Annex 3: Lease / Rental Agreement (Page 2/" + leasePageCount + ")",
    body: makeAnnexDocBody("የቤት / የቦታ ኪራይ ውል ስምምነት ገጽ 2", profile.leaseContractDocPage2 || profile.leaseContractDoc, profile.leaseContractDocPage2Name || profile.leaseContractDocName)
  });
  if (leasePageCount === 3) {
    pageList.push({
      titleAm: "አባሪ 3፡ የቤት / የቦታ ኪራይ ውል ሰነድ - ገጽ 3/3",
      titleEn: "Annex 3: Lease / Rental Agreement (Page 3/3)",
      body: makeAnnexDocBody("የቤት / የቦታ ኪራይ ውል ስምምነት ገጽ 3", profile.leaseContractDocPage3, profile.leaseContractDocPage3Name)
    });
  }

  // Annex 4: Identity & Marital Status Documents (2 Pages)
  pageList.push({
    titleAm: "አባሪ 4፡ የማንነት መታወቂያ እና የጋብቻ ሁኔታ ሰነዶች - ገጽ 1/2",
    titleEn: "Annex 4: National / Digital ID Card Front & Back (Page 1/2)",
    body: makeAnnexDocBody("የታደሰ ዲጂታል / ብሔራዊ መታወቂያ ቅጂ (ፊትና ጀርባ)", profile.idCardDoc, profile.idCardDocName)
  });
  pageList.push({
    titleAm: "አባሪ 4፡ የማንነት መታወቂያ እና የጋብቻ ሁኔታ ሰነዶች - ገጽ 2/2",
    titleEn: "Annex 4: Marriage / Single Status Certificate (Page 2/2)",
    body: makeAnnexDocBody("የጋብቻ ሁኔታ / የነጠላነት ማረጋገጫ ምስክር ወረቀት ቅጂ", profile.maritalStatusDoc, profile.maritalStatusDocName)
  });

  // Calculate exact total pages dynamically
  var TOTAL_PAGES = pageList.length;
  var pages = pageList.map(function (item, idx) {
    return pageWrap(idx + 1, TOTAL_PAGES, item.titleAm, item.titleEn, item.body, profile);
  }).join("");

  return '<!DOCTYPE html><html lang="am" dir="ltr"><head><meta charset="UTF-8">' +
    '<title>' + escapeHtml(profile.shopName || "የሱቅ ሪፖርት") + ' — የተሟላ ሪፖርትና አባሪዎች (' + TOTAL_PAGES + ' ገጾች)</title><style>' +
    '@page{ size: A4; margin: 10mm; }' +
    '*{box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}' +
    'html,body{background-color:#ffffff!important;color:#000000!important;margin:0;padding:0;font-family:"Noto Sans Ethiopic",-apple-system,"Segoe UI",Roboto,Arial,sans-serif;font-size:11.5px;line-height:1.5;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}' +
    '.rannex-img{max-width:100%;max-height:720px;width:auto;height:auto;object-fit:contain;border-radius:6px;box-shadow:0 1px 4px rgba(0,0,0,0.08);margin:0 auto;display:block;page-break-inside:avoid;break-inside:avoid;}' +
    '.rmain{padding:14px 12px;max-width:920px;margin:0 auto;background:#ffffff;color:#000000;}' +
    '.rpage{page-break-inside:avoid;break-inside:avoid;page-break-after:always;break-after:page;padding:20px 22px 20px;border:1px solid #cbd5e1;border-radius:10px;margin-bottom:24px;background:#ffffff;box-shadow:0 1px 4px rgba(0,0,0,0.04);color:#000000;}' +
    '.rpage:last-child{page-break-after:auto;break-after:auto;margin-bottom:0;}' +
    '.rpage-head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1e3a8a;margin-bottom:14px;padding-bottom:10px;page-break-inside:avoid;break-inside:avoid;}' +
    '.rpage-badge{display:inline-block;padding:2px 10px;border-radius:12px;background:#1e3a8a;color:#ffffff;font-size:10px;font-weight:800;letter-spacing:0.5px;}' +
    'h1{font-size:17px;margin:0 0 3px;color:#1e3a8a;font-weight:900;letter-spacing:0.2px;}' +
    '.rsub{font-size:10.5px;color:#1a1a1a;font-weight:600;}' +
    'h2{font-size:12.5px;color:#1e3a8a;margin:16px 0 8px;border-left:3.5px solid #2563eb;padding-left:8px;font-weight:800;page-break-inside:avoid;break-inside:avoid;page-break-after:avoid;break-after:avoid;}' +
    '.rhl-grid{display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:10px;margin:8px 0 14px;page-break-inside:avoid;break-inside:avoid;}' +
    '.rhl{background:#f8fafc;border-radius:8px;padding:10px 12px;border:1px solid #cbd5e1;border-left:4px solid #cbd5e1;page-break-inside:avoid;break-inside:avoid;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}' +
    '.rhl.blue{border-left-color:#3b82f6;background:#f0f7ff;} .rhl.green{border-left-color:#10b981;background:#f0fdf4;} .rhl.red{border-left-color:#ef4444;background:#fef2f2;} .rhl.amber{border-left-color:#f59e0b;background:#fffbeb;} .rhl.navy{border-left-color:#1e3a8a;background:#f1f5f9;}' +
    '.rhl-label{font-size:10px;color:#1a1a1a;font-weight:700;margin-bottom:3px;}' +
    '.rhl-value{font-size:13.5px;font-weight:900;color:#000000;line-height:1.2;}' +
    '.rkv-grid{display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:8px 14px;margin:8px 0 12px;page-break-inside:avoid;break-inside:avoid;}' +
    '.rkv-row{display:flex;justify-content:space-between;align-items:baseline;padding:6px 8px;background:#f8fafc;border-radius:6px;border:1px solid #cbd5e1;font-size:11px;page-break-inside:avoid;break-inside:avoid;color:#000000;}' +
    '.rkv-key{color:#1a1a1a;font-weight:700;margin-right:8px;flex-shrink:0;}' +
    '.rkv-val{color:#000000;font-weight:800;text-align:right;word-break:break-word;}' +
    'table{width:100%;border-collapse:collapse;font-size:11px;margin:8px 0 12px;border:1px solid #cbd5e1;page-break-inside:auto;break-inside:auto;}' +
    'thead{display:table-header-group;}' +
    'tbody{display:table-row-group;}' +
    'th{background:#1e3a8a!important;color:#ffffff!important;padding:8px 6px;text-align:right;font-weight:800;border:1px solid #1e3a8a;font-size:10.5px;letter-spacing:0.2px;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}' +
    'th:first-child{text-align:left;}' +
    'td{padding:6px 7px;border:1px solid #cbd5e1;text-align:right;color:#000000;}' +
    'td:first-child{text-align:left;}' +
    'tr{page-break-inside:avoid;break-inside:avoid;page-break-after:auto;break-after:auto;}' +
    'tr:nth-child(even) td{background:#f8fafc;}' +
    '.rbold{font-weight:800;color:#000000;}' +
    '.rempty{text-align:center!important;color:#64748b;padding:12px;font-style:italic;}' +
    '.rnote{font-size:10px;color:#1a1a1a;margin:8px 0;line-height:1.45;page-break-inside:avoid;break-inside:avoid;}' +
    '.rpara{font-size:11px;line-height:1.65;color:#000000;margin:6px 0 12px;page-break-inside:avoid;break-inside:avoid;}' +
    '.rgoal-ok{background:#f0fdf4!important;border:1px solid #bbf7d0;color:#166534!important;font-weight:800;padding:10px 14px;border-radius:8px;margin-top:10px;text-align:center;font-size:11.5px;page-break-inside:avoid;break-inside:avoid;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}' +
    '.rgoal-warn{background:#fef2f2!important;border:1px solid #fecaca;color:#991b1b!important;font-weight:800;padding:10px 14px;border-radius:8px;margin-top:10px;text-align:center;font-size:11.5px;page-break-inside:avoid;break-inside:avoid;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}' +
    '.rfootnote{font-size:9.5px;color:#1a1a1a;margin-top:14px;text-align:center;page-break-inside:avoid;break-inside:avoid;}' +
    '@media print{' +
      '*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}' +
      'html,body{background-color:#ffffff!important;color:#000000!important;font-size:11px;height:auto!important;min-height:auto!important;max-height:none!important;overflow:visible!important;position:static!important;}' +
      '.report-overlay-bar,.rbackbar,.no-print,button,nav,header,footer{display:none!important;visibility:hidden!important;}' +
      '#printable-report,#printable-report *,.rmain,.rmain *,.rpage,.rpage *{visibility:visible!important;color:#000000!important;}' +
      'th{color:#ffffff!important;background-color:#1e3a8a!important;}' +
      '.rmain{padding:0!important;max-width:100%!important;margin:0!important;width:100%!important;height:auto!important;min-height:auto!important;overflow:visible!important;}' +
      '.rpage{border:none!important;box-shadow:none!important;padding:0 0 18px 0!important;margin-bottom:0!important;page-break-inside:avoid!important;break-inside:avoid!important;page-break-after:always!important;break-after:page!important;height:auto!important;min-height:auto!important;overflow:visible!important;}' +
      '.rpage:last-child{page-break-after:auto!important;break-after:auto!important;}' +
      '.rhl{border:1px solid #cbd5e1!important;}' +
      '.rkv-row{border:1px solid #cbd5e1!important;background:#ffffff!important;}' +
    '}' +
    '</style></head><body>' +
    '<div id="printable-report" class="rmain">' + pages + '</div>' +
    '</body></html>';
}

export function downloadHtmlAsPdf(html, title, showToast, btnEl, frameEl) {
  var originalText = btnEl ? btnEl.textContent : "";
  if (btnEl) {
    btnEl.disabled = true;
    btnEl.textContent = "⏳ ፒዲኤፍ እየተዘጋጀ ነው...";
    btnEl.style.opacity = "0.7";
  }
  if (showToast) showToast("⏳ ፒዲኤፍ እየተዘጋጀ ነው... እባክዎ ይጠብቁ");

  var cleanFileName = (title || "Shop_Report").replace(/[^a-zA-Z0-9_\u1200-\u137F]/g, "_") + "_" + (new Date().toISOString().slice(0, 10)) + ".pdf";

  function finishSuccess() {
    if (btnEl) {
      btnEl.disabled = false;
      btnEl.textContent = originalText;
      btnEl.style.opacity = "1";
    }
    if (showToast) showToast("✓ ፒዲኤፍ ፋይሉ በተሳካ ሁኔታ ወርዷል");
  }

  function finishFail(err) {
    console.error("PDF generation error:", err);
    if (btnEl) {
      btnEl.disabled = false;
      btnEl.textContent = originalText;
      btnEl.style.opacity = "1";
    }
    // Fallback to print
    try {
      if (frameEl && frameEl.contentWindow) {
        frameEl.contentWindow.focus();
        frameEl.contentWindow.print();
      } else {
        window.print();
      }
    } catch (e) {}
    if (showToast) showToast("⚠️ ፒዲኤፍ ማውረድ አልተቻለም — የማተሚያ መስኮቱ ተከፍቷል");
  }

  if (typeof window.html2pdf !== "function") {
    finishFail("html2pdf library is not loaded");
    return;
  }

  try {
    // Create a fully rendered, visible container with dynamic height to guarantee 100% full content capture
    var tempContainer = document.createElement("div");
    tempContainer.className = "report-container pdf-container";
    tempContainer.style.position = "fixed";
    tempContainer.style.left = "0px";
    tempContainer.style.top = "0px";
    tempContainer.style.width = "794px";
    tempContainer.style.height = "auto";
    tempContainer.style.minHeight = "100%";
    tempContainer.style.background = "#ffffff";
    tempContainer.style.color = "#000000";
    tempContainer.style.zIndex = "999999";
    tempContainer.style.opacity = "1";
    tempContainer.style.visibility = "visible";
    tempContainer.style.pointerEvents = "none";
    tempContainer.innerHTML = html;
    document.body.appendChild(tempContainer);

    var targetElement = tempContainer.querySelector("#printable-report") || tempContainer;

    var opt = {
      margin: [6, 6, 6, 6],
      filename: cleanFileName,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        backgroundColor: "#ffffff"
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] }
    };

    // 500ms Print Delay to guarantee all data, base64 images, and fonts are completely loaded
    setTimeout(function () {
      try {
        window.html2pdf().set(opt).from(targetElement).save().then(function () {
          if (tempContainer && tempContainer.parentNode) tempContainer.parentNode.removeChild(tempContainer);
          finishSuccess();
        }).catch(function (err) {
          if (tempContainer && tempContainer.parentNode) tempContainer.parentNode.removeChild(tempContainer);
          finishFail(err);
        });
      } catch (err) {
        if (tempContainer && tempContainer.parentNode) tempContainer.parentNode.removeChild(tempContainer);
        finishFail(err);
      }
    }, 500);
  } catch (err) {
    finishFail(err);
  }
}

export function showReportPrintOverlay(html, showToast, title) {
  var overlay = document.createElement("div");
  overlay.className = "report-overlay";
  var bar = document.createElement("div");
  bar.className = "report-overlay-bar";

  var backBtn = document.createElement("button");
  backBtn.className = "btn btn-outline btn-sm";
  backBtn.style.background = "#ffffff";
  backBtn.style.color = "#122B4A";
  backBtn.style.fontWeight = "800";
  backBtn.textContent = "← ወደ ዋናው ገጽ ተመለስ";

  var dlBtn = document.createElement("button");
  dlBtn.className = "btn btn-emerald btn-sm";
  dlBtn.style.background = "#10b981";
  dlBtn.style.color = "#ffffff";
  dlBtn.style.fontWeight = "800";
  dlBtn.textContent = "📥 አውርድ (PDF)";

  function cleanup() {
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }

  backBtn.addEventListener("click", cleanup);

  var frame = document.createElement("iframe");
  frame.className = "report-overlay-frame";
  frame.setAttribute("title", title || "የሱቅ ሪፖርት");

  dlBtn.addEventListener("click", function () {
    downloadHtmlAsPdf(html, title, showToast, dlBtn, frame);
  });

  bar.appendChild(backBtn);
  bar.appendChild(dlBtn);
  overlay.appendChild(bar);
  overlay.appendChild(frame);
  document.body.appendChild(overlay);

  try {
    var blob = new Blob([html], { type: "text/html;charset=utf-8" });
    frame.src = URL.createObjectURL(blob);
  } catch (e) {
    frame.srcdoc = html;
  }

  if (showToast) showToast("✓ ሪፖርቱ ተዘጋጅቷል — 'አውርድ (PDF)' ይጫኑ");
}

export function exportPrintableReport(data, showToast, options) {
  var html = buildReportHtml(data, options);
  showReportPrintOverlay(html, showToast, "የተሟላ_የሱቅ_ሪፖርት");
}

/**
 * Print/PDF Export for Official Sales Receipt / Tax Invoice
 */
export function exportPrintableReceipt(data, sale, showToast) {
  var profile = data.profile || freshProfile();
  var stampHtml = officialStampSnippet(profile, { inline: true, opacity: 0.88, rotation: "-9deg" });
  var logoImg = profile.trademarkLogo || profile.managerPhoto || "";
  var totalCents = sale.totalCents || (sale.unitPriceCents * sale.qty);
  var advCents = sale.advanceCents || 0;
  var remCents = sale.paid ? 0 : (sale.creditRemainingCents !== undefined ? sale.creditRemainingCents : (totalCents - advCents));
  var payMethodLabel = sale.paymentMethod === "bank" ? ("በባንክ (" + (sale.bankName || "") + ")") : sale.paymentMethod === "credit" ? "በዱቤ" : "ጥሬ ገንዘብ";

  var itemsList = sale.items || [{
    name: sale.itemName,
    qty: sale.qty,
    unitPriceCents: sale.unitPriceCents,
    totalCents: totalCents
  }];

  var itemRows = itemsList.map(function (it, idx) {
    var lineTot = it.totalCents || (it.unitPriceCents * it.qty);
    return '<tr>' +
      '<td style="text-align:center;padding:7px 4px;border:1px solid #cbd5e1;">' + (idx + 1) + '</td>' +
      '<td style="padding:7px 10px;border:1px solid #cbd5e1;font-weight:700;color:#0f172a;">' + escapeHtml(it.name || it.itemName) + '</td>' +
      '<td style="text-align:center;padding:7px 4px;border:1px solid #cbd5e1;font-weight:600;">' + it.qty + '</td>' +
      '<td style="text-align:right;padding:7px 10px;border:1px solid #cbd5e1;">' + fmt(it.unitPriceCents) + '</td>' +
      '<td style="text-align:right;padding:7px 10px;border:1px solid #cbd5e1;font-weight:800;color:#1e3a8a;">' + fmt(lineTot) + '</td>' +
    '</tr>';
  }).join("");

  var html = '<!DOCTYPE html><html lang="am"><head><meta charset="UTF-8"><title>ደረሰኝ - ' + escapeHtml(sale.customer || "ሽያጭ") + '</title><style>' +
    '@page{ size: A4; margin: 10mm; }' +
    '*{box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}' +
    'body{font-family:"Noto Sans Ethiopic",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#0f172a;margin:0;padding:0;font-size:11.5px;background:#f8fafc;line-height:1.35;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}' +
    '.receipt-container{max-width:760px;margin:8px auto;background:#fff;padding:18px 22px 22px;border-radius:10px;box-shadow:0 1px 6px rgba(0,0,0,0.06);position:relative;border:1px solid #cbd5e1;page-break-inside:avoid;break-inside:avoid;}' +
    '.header{display:flex;justify-content:space-between;align-items:center;padding-bottom:10px;page-break-inside:avoid;break-inside:avoid;}' +
    '.header-divider{height:2.5px;background:#1e3a8a!important;width:100%;margin-bottom:12px;border-radius:2px;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}' +
    'table{width:100%;border-collapse:collapse;margin:8px 0 14px;font-size:11px;page-break-inside:auto;break-inside:auto;}' +
    'thead{display:table-header-group;}' +
    'tbody{display:table-row-group;}' +
    'th{background:#1e3a8a!important;color:#fff!important;padding:7px 8px;font-size:11px;font-weight:800;text-align:left;border:1px solid #1e3a8a;letter-spacing:0.3px;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}' +
    'td{padding:6px 8px;}' +
    'tr{page-break-inside:avoid;break-inside:avoid;page-break-after:auto;break-after:auto;}' +
    'tbody tr:nth-child(even){background:#f8fafc;}' +
    '.bottom-layout{display:grid;grid-template-columns:1.2fr 1fr;gap:16px;align-items:flex-start;margin-top:10px;page-break-inside:avoid;break-inside:avoid;}' +
    '.total-box{border:1.5px solid #cbd5e1;border-radius:8px;padding:10px 14px;background:#f8fafc;page-break-inside:avoid;break-inside:avoid;}' +
    '.total-row{display:flex;justify-content:space-between;padding:3.5px 0;font-size:11.5px;border-bottom:1px solid #e2e8f0;}' +
    '.total-row:last-child{border-bottom:none;}' +
    '.total-row.main{font-weight:900;font-size:12.5px;border-top:1.5px solid #cbd5e1;border-bottom:none;margin-top:4px;padding-top:6px;color:#1e3a8a;}' +
    '.auth-stamp-block{border:1.5px dashed #94a3b8;border-radius:8px;padding:8px 12px;background:#ffffff;display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:105px;page-break-inside:avoid;break-inside:avoid;}' +
    '@media print{ *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;} html,body{height:auto!important;min-height:auto!important;overflow:visible!important;margin:0!important;padding:0!important;background:#ffffff!important;color:#000000!important;} body, .pdf-container{background-color:#ffffff!important;color:#000000!important;} #printable-report, #printable-report *{visibility:visible!important;color:#000000!important;} th{color:#ffffff!important;background-color:#1e3a8a!important;} .receipt-container{max-width:100%!important;margin:0!important;box-shadow:none!important;border:none!important;padding:0!important;height:auto!important;overflow:visible!important;page-break-inside:avoid!important;break-inside:avoid!important;} .report-overlay-bar,.rbackbar,.no-print,button,nav,header,footer{display:none!important;visibility:hidden!important;} }' +
    '</style></head><body>' +
    '<div id="printable-report" class="receipt-container">' +
      '<div class="header">' +
        '<div style="display:flex;align-items:center;gap:14px;">' +
          (logoImg ? ('<img src="' + escapeHtml(logoImg) + '" alt="Logo" style="width:68px;height:68px;object-fit:cover;border-radius:50%;border:1.5px solid #cbd5e1;background:#fff;padding:2px;" />') : '<div style="width:68px;height:68px;border-radius:50%;border:1.5px dashed #94a3b8;background:#f8fafc;display:flex;align-items:center;justify-content:center;font-size:32px;">🏪</div>') +
          '<div>' +
            '<h2 style="margin:0 0 2px;color:#1e3a8a;font-size:18px;font-weight:900;">' + escapeHtml(profile.shopName || "የሽያጭ ደረሰኝ") + '</h2>' +
            (profile.legalBusinessName ? ('<div style="font-size:11px;font-weight:700;color:#334155;margin-bottom:2px;">' + escapeHtml(profile.legalBusinessName) + '</div>') : '') +
            '<div style="font-size:10px;color:#64748b;line-height:1.4;">' +
              (profile.tin ? ('<b>TIN:</b> ' + escapeHtml(profile.tin) + ' · ') : '') +
              (profile.phone ? ('<b>ስልክ:</b> ' + escapeHtml(profile.phone) + ' · ') : '') +
              (profile.address ? ('<b>አድራሻ:</b> ' + escapeHtml(profile.address)) : '') +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div style="text-align:right;">' +
          '<div style="font-size:14.5px;font-weight:900;color:#1e3a8a;text-transform:uppercase;letter-spacing:0.5px;">ይፋዊ የሽያጭ ደረሰኝ</div>' +
          '<div style="font-size:10.5px;color:#475569;margin-top:2px;">ደረሰኝ #: <b>' + escapeHtml(sale.orderId || ("#" + (sale.id || "").slice(0, 8).toUpperCase())) + '</b></div>' +
          '<div style="font-size:10.5px;color:#475569;">ቀን: <b>' + escapeHtml(sale.date || todayISO()) + '</b></div>' +
        '</div>' +
      '</div>' +
      '<div class="header-divider"></div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;background:#f8fafc;border:1px solid #e2e8f0;padding:8px 12px;border-radius:8px;margin-bottom:10px;font-size:11px;">' +
        '<div><b>የደንበኛ ስም:</b> ' + escapeHtml(sale.customer || "ስም ያልገለጸ ደንበኛ") + '</div>' +
        '<div>' + (sale.customerPhone ? ('<b>ስልክ:</b> ' + escapeHtml(sale.customerPhone) + ' · ') : '') + '<b>የክፍያ አይነት:</b> ' + escapeHtml(payMethodLabel) + '</div>' +
      '</div>' +
      '<table>' +
        '<thead><tr><th style="width:38px;text-align:center;">ተ.ቁ</th><th>የዕቃ ስም</th><th style="text-align:center;width:60px;">ብዛት</th><th style="text-align:right;width:115px;">ነጠላ ዋጋ</th><th style="text-align:right;width:125px;">ጠቅላላ ዋጋ</th></tr></thead>' +
        '<tbody>' + itemRows + '</tbody>' +
      '</table>' +
      '<div class="bottom-layout">' +
        '<div>' +
          '<div style="font-size:10px;color:#64748b;margin-bottom:8px;line-height:1.4;">' +
            '* ስለጎበኙን እናመሰግናለን! ይህ ደረሰኝ በህጋዊ የሂሳብ አሰራር የተረጋገጠ ነው። ዕቃ ከተረከቡ በኋላ ያለ ደረሰኝ መመለስ አይቻልም።' +
          '</div>' +
          '<div class="auth-stamp-block">' +
            '<div style="flex:1;">' +
              '<div style="font-size:10.5px;font-weight:900;color:#1e3a8a;margin-bottom:26px;">AUTHORIZED SIGNATURE & STAMP</div>' +
              '<div style="font-size:10px;color:#475569;border-top:1.5px solid #64748b;padding-top:4px;font-weight:700;">' +
                'የተረካቢ / የሻጭ ፊርማ (Signature)' +
              '</div>' +
            '</div>' +
            '<div style="flex-shrink:0;width:115px;height:115px;display:flex;align-items:center;justify-content:center;">' +
              stampHtml +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="total-box">' +
          '<div class="total-row"><span>ጠቅላላ ዋጋ:</span><b>' + fmt(totalCents) + '</b></div>' +
          '<div class="total-row"><span>የተከፈለ:</span><b style="color:#16a34a;">' + fmt(sale.paid ? totalCents : advCents) + '</b></div>' +
          '<div class="total-row" style="color:' + (remCents > 0 ? '#dc2626' : '#1e293b') + ';"><span>ቀሪ ዕዳ:</span><b>' + fmt(remCents) + '</b></div>' +
          '<div class="total-row main"><span>ሁኔታ:</span><span style="color:' + ((sale.paid || remCents <= 0) ? '#16a34a' : '#dc2626') + ';">' + ((sale.paid || remCents <= 0) ? "ሙሉ በሙሉ ተከፍሏል" : "አልተከፈለ ወይም ቀሪ አለበት") + '</span></div>' +
        '</div>' +
      '</div>' +
    '</div></body></html>';

  printHtmlDocument(html, "የሽያጭ ደረሰኝ", showToast);
}

/**
 * Print/PDF Export for Freight & Shipment Report
 */
export function exportPrintableFreightReport(data, shipment, showToast) {
  var profile = data.profile || freshProfile();
  var stampHtml = officialStampSnippet(profile);

  var itemsRows = (shipment.items || []).map(function (it, idx) {
    return '<tr>' +
      '<td style="text-align:center;padding:6px;border:1px solid #e2e8f0;">' + (idx + 1) + '</td>' +
      '<td style="padding:6px 8px;border:1px solid #e2e8f0;font-weight:700;">' + escapeHtml(it.name) + (it.code ? (' <span style="color:#64748b;font-weight:400;">(' + escapeHtml(it.code) + ')</span>') : '') + '</td>' +
      '<td style="text-align:center;padding:6px;border:1px solid #e2e8f0;">' + it.totalQty + '</td>' +
      '<td style="text-align:center;padding:6px;border:1px solid #e2e8f0;color:#dc2626;">' + (it.damagedQty || 0) + '</td>' +
      '<td style="text-align:center;padding:6px;border:1px solid #e2e8f0;font-weight:700;color:#16a34a;">' + (it.usableQty !== undefined ? it.usableQty : (it.totalQty - (it.damagedQty || 0))) + '</td>' +
      '<td style="text-align:right;padding:6px 8px;border:1px solid #e2e8f0;">' + fmt(it.unitPurchasePriceCents || 0) + '</td>' +
      '<td style="text-align:right;padding:6px 8px;border:1px solid #e2e8f0;font-weight:700;color:#1e3a8a;">' + fmt(it.landedCostCents || 0) + '</td>' +
      '<td style="text-align:right;padding:6px 8px;border:1px solid #e2e8f0;">' + fmt(it.sellPriceCents || 0) + '</td>' +
    '</tr>';
  }).join("");

  var html = '<!DOCTYPE html><html lang="am"><head><meta charset="UTF-8"><title>የጭነት ሪፖርት - ' + escapeHtml(shipment.freightCompany || "ጭነት") + '</title><style>' +
    '@page{ size: A4; margin: 10mm; }' +
    '*{box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}' +
    'body{font-family:"Noto Sans Ethiopic",-apple-system,sans-serif;color:#1e293b;margin:0;font-size:11.5px;background:#f8fafc;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}' +
    '.report-box{max-width:850px;margin:16px auto;background:#fff;padding:24px 28px;border-radius:12px;border:1px solid #cbd5e1;position:relative;page-break-inside:avoid;break-inside:avoid;}' +
    'table{width:100%;border-collapse:collapse;margin:14px 0;font-size:11px;page-break-inside:auto;break-inside:auto;}' +
    'thead{display:table-header-group;}' +
    'tbody{display:table-row-group;}' +
    'th{background:#122B4A!important;color:#fff!important;padding:7px;text-align:left;border:1px solid #122B4A;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}' +
    'tr{page-break-inside:avoid;break-inside:avoid;page-break-after:auto;break-after:auto;}' +
    '@media print{ *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;} html,body{height:auto!important;min-height:auto!important;overflow:visible!important;background:#ffffff!important;color:#000000!important;} body, .pdf-container{background-color:#ffffff!important;color:#000000!important;} #printable-report, #printable-report *{visibility:visible!important;color:#000000!important;} th{color:#ffffff!important;background-color:#122B4A!important;} .report-box{margin:0!important;box-shadow:none!important;border:none!important;padding:0!important;height:auto!important;overflow:visible!important;page-break-inside:avoid!important;break-inside:avoid!important;} .report-overlay-bar,.rbackbar,.no-print,button,nav,header,footer{display:none!important;visibility:hidden!important;} }' +
    '</style></head><body>' +
    '<div id="printable-report" class="report-box">' +
      '<div style="border-bottom:2px solid #122B4A;padding-bottom:12px;margin-bottom:14px;display:flex;justify-content:space-between;">' +
        '<div>' +
          '<h2 style="margin:0 0 3px;color:#122B4A;font-size:18px;">' + escapeHtml(profile.shopName || "የንግድ ድርጅት") + '</h2>' +
          '<div style="font-size:12px;font-weight:700;color:#1e3a8a;">የጭነትና የትራንስፖርት ይፋዊ ሰነድ / Official Freight & Shipment Report</div>' +
        '</div>' +
        '<div style="text-align:right;font-size:11px;color:#64748b;">' +
          '<div>የጭነት መለያ: #' + (shipment.id || "").slice(0, 8).toUpperCase() + '</div>' +
          '<div>ቀን: ' + (shipment.date || todayISO()) + '</div>' +
        '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;background:#f8fafc;border:1px solid #e2e8f0;padding:12px;border-radius:8px;margin-bottom:14px;">' +
        '<div><b>የትራንስፖርት ድርጅት:</b> ' + escapeHtml(shipment.freightCompany || "-") + '</div>' +
        '<div><b>የመኪና ታርጋ:</b> ' + escapeHtml(shipment.vehiclePlate || "-") + '</div>' +
        '<div><b>የሾፌር ስም:</b> ' + escapeHtml(shipment.driverName || "-") + '</div>' +
        '<div><b>መድረሻ መጋዘን/ሱቅ:</b> ' + escapeHtml(shipment.destinationLocationName || "-") + '</div>' +
        '<div><b>ጠቅላላ የትራንስፖርት ወጪ:</b> ' + fmt(shipment.totalFreightCents || 0) + '</div>' +
        '<div><b>ጠቅላላ የዕቃ ግዢ ወጪ:</b> ' + fmt(shipment.totalPurchaseCostCents || 0) + '</div>' +
      '</div>' +
      '<table>' +
        '<thead><tr><th>ተ.ቁ</th><th>የዕቃ ስም</th><th>የገባ ብዛት</th><th>የተበላሸ</th><th>የተረከብነው</th><th>የመግዣ ዋጋ</th><th>የቋመበት ዋጋ</th><th>መሸጫ ዋጋ</th></tr></thead>' +
        '<tbody>' + itemsRows + '</tbody>' +
      '</table>' +
      '<div style="margin-top:20px;display:flex;justify-content:space-between;border-top:1px solid #cbd5e1;padding-top:12px;">' +
        '<div><b>የተረካቢ ፊርማ:</b> ____________________</div>' +
        '<div><b>የሾፌር/አስረካቢ ፊርማ:</b> ____________________</div>' +
      '</div>' +
      stampHtml +
    '</div></body></html>';

  printHtmlDocument(html, "የጭነት ሪፖርት", showToast);
}

/**
 * Print/PDF Export for Inventory Summary & Valuation Report
 */
export function exportPrintableInventorySummary(data, showToast) {
  var profile = data.profile || freshProfile();
  var stampHtml = officialStampSnippet(profile);
  var totalValCents = inventoryValueCents(data);

  var itemsRows = (data.items || []).map(function (it, idx) {
    var stock = Math.max(0, itemStock(data, it.id));
    var sellPrice = (typeof it.sellPriceCents === "number" && it.sellPriceCents > 0) ? it.sellPriceCents : (it.costPriceCents || 0);
    var val = stock * sellPrice;
    return '<tr>' +
      '<td style="text-align:center;padding:6px;border:1px solid #e2e8f0;">' + (idx + 1) + '</td>' +
      '<td style="padding:6px 8px;border:1px solid #e2e8f0;font-weight:700;">' + escapeHtml(it.name) + (it.code ? (' <span style="color:#64748b;font-weight:400;">(' + escapeHtml(it.code) + ')</span>') : '') + '</td>' +
      '<td style="padding:6px 8px;border:1px solid #e2e8f0;color:#475569;">' + escapeHtml(it.locationName || it.location || "ዋና ሱቅ") + '</td>' +
      '<td style="text-align:center;padding:6px;border:1px solid #e2e8f0;font-weight:700;">' + stock + '</td>' +
      '<td style="text-align:right;padding:6px 8px;border:1px solid #e2e8f0;">' + fmt(it.costPriceCents || 0) + '</td>' +
      '<td style="text-align:right;padding:6px 8px;border:1px solid #e2e8f0;">' + fmt(it.sellPriceCents || 0) + '</td>' +
      '<td style="text-align:right;padding:6px 8px;border:1px solid #e2e8f0;font-weight:700;color:#1e3a8a;">' + fmt(val) + '</td>' +
    '</tr>';
  }).join("");

  var html = '<!DOCTYPE html><html lang="am"><head><meta charset="UTF-8"><title>የዕቃ ክምችትና የእሴት ማጠቃለያ ሪፖርት</title><style>' +
    '@page{ size: A4; margin: 10mm; }' +
    '*{box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}' +
    'body{font-family:"Noto Sans Ethiopic",-apple-system,sans-serif;color:#1e293b;margin:0;font-size:11.5px;background:#f8fafc;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}' +
    '.report-box{max-width:850px;margin:16px auto;background:#fff;padding:24px 28px;border-radius:12px;border:1px solid #cbd5e1;position:relative;page-break-inside:avoid;break-inside:avoid;}' +
    'table{width:100%;border-collapse:collapse;margin:14px 0;font-size:11px;page-break-inside:auto;break-inside:auto;}' +
    'thead{display:table-header-group;}' +
    'tbody{display:table-row-group;}' +
    'th{background:#122B4A!important;color:#fff!important;padding:7px;text-align:left;border:1px solid #122B4A;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}' +
    'tr{page-break-inside:avoid;break-inside:avoid;page-break-after:auto;break-after:auto;}' +
    '@media print{ *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;} html,body{height:auto!important;min-height:auto!important;overflow:visible!important;background:#ffffff!important;color:#000000!important;} body, .pdf-container{background-color:#ffffff!important;color:#000000!important;} #printable-report, #printable-report *{visibility:visible!important;color:#000000!important;} th{color:#ffffff!important;background-color:#122B4A!important;} .report-box{margin:0!important;box-shadow:none!important;border:none!important;padding:0!important;height:auto!important;overflow:visible!important;page-break-inside:avoid!important;break-inside:avoid!important;} .report-overlay-bar,.rbackbar,.no-print,button,nav,header,footer{display:none!important;visibility:hidden!important;} }' +
    '</style></head><body>' +
    '<div id="printable-report" class="report-box">' +
      '<div style="border-bottom:2px solid #122B4A;padding-bottom:12px;margin-bottom:14px;display:flex;justify-content:space-between;">' +
        '<div>' +
          '<h2 style="margin:0 0 3px;color:#122B4A;font-size:18px;">' + escapeHtml(profile.shopName || "የንግድ ድርጅት") + '</h2>' +
          '<div style="font-size:12px;font-weight:700;color:#1e3a8a;">የዕቃ ክምችትና የእሴት ማጠቃለያ ሪፖርት / Inventory Valuation Summary</div>' +
        '</div>' +
        '<div style="text-align:right;font-size:11px;color:#64748b;">' +
          '<div>የተዘጋጀበት ቀን: ' + todayISO() + '</div>' +
          '<div>ጠቅላላ የዕቃ ዓይነቶች: ' + (data.items || []).length + '</div>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;background:#eff6ff;border:1px solid #bfdbfe;padding:12px 16px;border-radius:8px;margin-bottom:14px;">' +
        '<div><span style="color:#1e3a8a;font-weight:700;">ጠቅላላ የዕቃ ክምችት እሴት (Total Inventory Asset Value):</span></div>' +
        '<div style="font-size:16px;font-weight:900;color:#1e3a8a;">' + fmt(totalValCents) + '</div>' +
      '</div>' +
      '<table>' +
        '<thead><tr><th>ተ.ቁ</th><th>የዕቃ ስም</th><th>መገኛ ቦታ</th><th>የቀረ ስቶክ</th><th>የቋመበት ዋጋ</th><th>መሸጫ ዋጋ</th><th>ጠቅላላ እሴት</th></tr></thead>' +
        '<tbody>' + itemsRows + '</tbody>' +
      '</table>' +
      stampHtml +
    '</div></body></html>';

  printHtmlDocument(html, "የክምችት ሪፖርት", showToast);
}

function printHtmlDocument(html, title, showToast) {
  showReportPrintOverlay(html, showToast, title || "ሰነድ");
}
