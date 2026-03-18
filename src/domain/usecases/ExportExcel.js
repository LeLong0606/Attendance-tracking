import ExcelJS from "exceljs";

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const toDateKey = (dateValue) => {
  if (!dateValue) return "";

  if (typeof dateValue === "string") {
    const isoMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    }
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const buildDayColumns = (month, year) => {
  const daysInMonth = new Date(year, month, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, idx) => {
    const day = idx + 1;
    const date = new Date(year, month - 1, day);
    const weekdayNum = date.getDay();
    const weekday = weekdayNum === 0 ? "CN" : `T${weekdayNum + 1}`;
    const monthStr = String(month).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");

    return {
      key: `${year}-${monthStr}-${dayStr}`,
      weekday,
      day,
    };
  });
};

export const exportWorkdaySalaryToExcel = ({
  rows,
  employeeSalaries,
  month,
  year,
  timesheetDetailsByEmployee = {},
}) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("Không có dữ liệu để xuất Excel");
  }

  const dayColumns = buildDayColumns(month, year);

  // 2 cột trống theo yêu cầu: cột lương công chuẩn và lương tăng ca.
  const summaryHeaders = ["", "", "", "", "LƯƠNG", "PC NHÀ TRỌ", "TỔNG LƯƠNG", "TRỪ TẠM ỨNG", "CÒN LẠI"];

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(`Luong_T${month}_${year}`);

  const dayStartCol = 3;
  const dayEndCol = dayStartCol + dayColumns.length - 1;
  const summaryStartCol = dayEndCol + 1;

  const colors = {
    yellow: "FFFFFF00",
    lightBlue: "FFBDD7EE",
    lightGray: "FFD9D9D9",
    lightGreen: "FF92D050",
    lightOrange: "FFFFC000",
    lightCream: "FFFFF2CC",
    white: "FFFFFFFF",
    redText: "FFFF0000",
    darkText: "FF1F2937",
    border: "FF000000",
  };

  const applyCell = (cell, options = {}) => {
    const {
      fillColor,
      bold = false,
      fontColor,
      align = "center",
      numFmt,
    } = options;

    if (fillColor) {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: fillColor },
      };
    }

    cell.font = {
      bold,
      color: { argb: fontColor || colors.darkText },
      size: 11,
    };

    cell.alignment = {
      vertical: "middle",
      horizontal: align,
      wrapText: true,
    };

    cell.border = {
      top: { style: "thin", color: { argb: colors.border } },
      left: { style: "thin", color: { argb: colors.border } },
      bottom: { style: "thin", color: { argb: colors.border } },
      right: { style: "thin", color: { argb: colors.border } },
    };

    if (numFmt) {
      cell.numFmt = numFmt;
    }
  };

  worksheet.mergeCells(1, 1, 1, 2);
  worksheet.mergeCells(2, 1, 2, 2);
  worksheet.getCell(1, 1).value = "Thứ";
  worksheet.getCell(2, 1).value = "Ngày";
  applyCell(worksheet.getCell(1, 1), { fillColor: colors.yellow, bold: true, align: "left" });
  applyCell(worksheet.getCell(2, 1), { fillColor: colors.yellow, bold: true, align: "left" });

  dayColumns.forEach((dayCol, idx) => {
    const col = dayStartCol + idx;
    worksheet.getCell(1, col).value = dayCol.weekday;
    worksheet.getCell(2, col).value = dayCol.day;

    applyCell(worksheet.getCell(1, col), {
      fillColor: colors.yellow,
      bold: true,
      fontColor: colors.redText,
    });

    applyCell(worksheet.getCell(2, col), {
      fillColor: colors.yellow,
      bold: true,
      fontColor: colors.redText,
    });
  });

  summaryHeaders.forEach((header, idx) => {
    const col = summaryStartCol + idx;
    worksheet.getCell(1, col).value = header;
    worksheet.getCell(2, col).value = "";

    applyCell(worksheet.getCell(1, col), {
      fillColor: colors.lightGray,
      bold: true,
    });

    applyCell(worksheet.getCell(2, col), {
      fillColor: colors.lightGray,
    });
  });

  let rowIndex = 3;

  rows.forEach((row) => {
    const salary = employeeSalaries[row.id] || {};

    const totalWorkDays = toNumber(salary.totalWorkDays);
    const totalOvertimeHours = toNumber(salary.totalOvertimeHours);
    const baseSalary = toNumber(salary.baseSalary);
    const totalAllowances = toNumber(salary.totalAllowances);
    const totalAmount = toNumber(salary.totalAmount);
    const advancePayment = toNumber(salary.advancePayment);
    const remainingAmount = toNumber(salary.remainingAmount);

    const dailySalary = totalWorkDays > 0 ? baseSalary / totalWorkDays : 0;
    const overtimeHourlySalary = dailySalary > 0 ? (dailySalary / 8) * 1.5 : 0;
    const overtimeSalary = overtimeHourlySalary * totalOvertimeHours;

    // Theo yêu cầu: cột LƯƠNG = lương công chuẩn + lương tăng ca.
    const totalSalary = baseSalary + overtimeSalary;

    const details = Array.isArray(timesheetDetailsByEmployee[row.id])
      ? timesheetDetailsByEmployee[row.id]
      : [];

    const detailMap = details.reduce((acc, detail) => {
      const dateKey = toDateKey(detail.workDate);
      if (!dateKey) return acc;

      acc[dateKey] = {
        standardWorkDays: toNumber(detail.standardWorkDays),
        overtimeHours: toNumber(detail.overtimeHours),
      };

      return acc;
    }, {});

    const workValues = dayColumns.map((dayCol) => {
      const detail = detailMap[dayCol.key];
      return detail ? toNumber(detail.standardWorkDays) : "";
    });

    const overtimeValues = dayColumns.map((dayCol) => {
      const detail = detailMap[dayCol.key];
      return detail ? toNumber(detail.overtimeHours) : "";
    });

    const workRow = [
      row.fullName || "",
      "Công",
      ...workValues,
      "Tổng Công",
      totalWorkDays,
      dailySalary,
      baseSalary,
      totalSalary,
      totalAllowances,
      totalAmount,
      advancePayment,
      remainingAmount,
    ];

    const overtimeRow = [
      "",
      "Tăng Ca",
      ...overtimeValues,
      "Tổng Tăng Ca (h)",
      totalOvertimeHours,
      overtimeHourlySalary,
      overtimeSalary,
      "",
      "",
      "",
      "",
      "",
    ];

    worksheet.addRow(workRow);
    worksheet.addRow(overtimeRow);

    for (let col = 1; col <= summaryStartCol + summaryHeaders.length - 1; col += 1) {
      const workCell = worksheet.getCell(rowIndex, col);
      const overtimeCell = worksheet.getCell(rowIndex + 1, col);

      applyCell(workCell, {
        fillColor: colors.white,
        align: col === 1 ? "left" : "center",
      });

      applyCell(overtimeCell, {
        fillColor: colors.lightBlue,
        align: col === 1 ? "left" : "center",
      });
    }

    applyCell(worksheet.getCell(rowIndex, 2), { fillColor: colors.lightCream, bold: true });
    applyCell(worksheet.getCell(rowIndex + 1, 2), { fillColor: colors.lightBlue, bold: true });

    applyCell(worksheet.getCell(rowIndex, summaryStartCol), {
      fillColor: colors.lightCream,
      bold: true,
      align: "left",
    });

    applyCell(worksheet.getCell(rowIndex + 1, summaryStartCol), {
      fillColor: colors.lightCream,
      bold: true,
      align: "left",
    });

    applyCell(worksheet.getCell(rowIndex, summaryStartCol + 1), { fillColor: colors.yellow, bold: true });
    applyCell(worksheet.getCell(rowIndex + 1, summaryStartCol + 1), { fillColor: colors.yellow, bold: true });

    // Cột LƯƠNG
    applyCell(worksheet.getCell(rowIndex, summaryStartCol + 4), {
      fillColor: colors.yellow,
      bold: true,
      fontColor: colors.redText,
    });

    // Cột TỔNG LƯƠNG
    applyCell(worksheet.getCell(rowIndex, summaryStartCol + 6), {
      fillColor: colors.lightOrange,
      bold: true,
      fontColor: colors.redText,
    });

    // Cột CÒN LẠI
    applyCell(worksheet.getCell(rowIndex, summaryStartCol + 8), {
      fillColor: colors.lightGreen,
      bold: true,
    });

    if (typeof worksheet.getCell(rowIndex, summaryStartCol + 1).value === "number") {
      worksheet.getCell(rowIndex, summaryStartCol + 1).numFmt = "#,##0.##";
    }

    if (typeof worksheet.getCell(rowIndex + 1, summaryStartCol + 1).value === "number") {
      worksheet.getCell(rowIndex + 1, summaryStartCol + 1).numFmt = "#,##0.##";
    }

    for (let c = summaryStartCol + 2; c <= summaryStartCol + 8; c += 1) {
      const workCell = worksheet.getCell(rowIndex, c);
      if (typeof workCell.value === "number") {
        workCell.numFmt = "#,##0.##";
      }

      const overtimeCell = worksheet.getCell(rowIndex + 1, c);
      if (typeof overtimeCell.value === "number") {
        overtimeCell.numFmt = "#,##0.##";
      }
    }

    rowIndex += 2;
  });

  worksheet.columns = [
    { width: 28 },
    { width: 9 },
    ...dayColumns.map(() => ({ width: 4.8 })),
    { width: 14 },
    { width: 10 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
  ];

  worksheet.views = [{ state: "frozen", xSplit: 2, ySplit: 2 }];

  const fileName = `bang-cong-luong-thang-${month}-${year}.xlsx`;

  return workbook.xlsx.writeBuffer().then((buffer) => {
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  });
};
