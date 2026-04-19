function doGet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName("참여자목록");
  const participationSheet = ss.getSheetByName("참여현황");

  const masterData = masterSheet.getDataRange().getValues();
  const master = masterData.slice(1).map(row => ({
    name: row[0], // A열: 이름
    grade: row[1], // B열: 등급
    role: row[2] // C열: 분류 (운영진/본캐/부캐)
  }));

  const participationData = participationSheet.getDataRange().getValues();
  const participation = participationData.slice(1).map(row => ({
    시간대: row[0], // A열: 시간대
    번호: row[1],   // B열: 번호
    이름: row[2],   // C열: 이름
    분류: row[3],   // D열: 분류
    업데이트시간: row[4] // E열: 업데이트시간
  }));

  return ContentService.createTextOutput(JSON.stringify({ master, participation }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName("참여자목록");
  const participationSheet = ss.getSheetByName("참여현황");

  if (data.action === "saveParticipation") {
    const time = data.time;
    const list = data.list; // [{name, role, time}]

    // 해당 시간대의 기존 데이터만 삭제 (다른 시간대 데이터는 유지)
    const rows = participationSheet.getDataRange().getValues();
    for (let i = rows.length - 1; i >= 1; i--) {
      if (rows[i][0] === time) {
        participationSheet.deleteRow(i + 1);
      }
    }

    // 새로운 데이터 추가
    const now = new Date();
    const timestamp = Utilities.formatDate(now, "GMT+9", "yyyy-MM-dd HH:mm");
    
    list.forEach((item, index) => {
      participationSheet.appendRow([
        time,
        index + 1,
        item.name,
        item.role,
        timestamp
      ]);
    });

    return ContentService.createTextOutput("Success");
  }

  if (data.action === "addRow") {
    // 참여자목록 탭 구조: A:이름, B:등급, C:분류
    masterSheet.appendRow([
      data.name,
      data.grade,
      data.role
    ]);
    return ContentService.createTextOutput("Success");
  }

  if (data.action === "updateCell") {
    // A:1, B:2, C:3
    const colMap = { "name": 1, "grade": 2, "role": 3 };
    const colIndex = colMap[data.field];
    if (colIndex) {
      masterSheet.getRange(data.rowIndex + 2, colIndex).setValue(data.value);
    }
    return ContentService.createTextOutput("Success");
  }

  if (data.action === "deleteRow") {
    masterSheet.deleteRow(data.rowIndex + 2);
    return ContentService.createTextOutput("Success");
  }
}
