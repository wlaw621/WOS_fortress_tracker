function doGet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName("참여자목록");
  const participationSheet = ss.getSheetByName("참여현황");

  const masterData = masterSheet.getDataRange().getValues();
  const master = masterData.slice(1).map(row => ({
    name: row[2], // C열: 이름
    grade: row[3], // D열: 분류 (R5/R4/R3...)
    role: row[3] // D열: 분류 (운영진/본캐/부캐) - 필요시 수정
  }));

  const participationData = participationSheet.getDataRange().getValues();
  const participation = participationData.slice(1).map(row => ({
    시간대: row[0],
    이름: row[2],
    분류: row[3],
    업데이트시간: row[4]
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

    // 해당 시간대의 기존 데이터 삭제
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
    masterSheet.appendRow([
      "", // 시간대(필요시)
      masterSheet.getLastRow(), 
      data.name,
      data.role, // C열
      new Date()
    ]);
    return ContentService.createTextOutput("Success");
  }

  if (data.action === "updateCell") {
    // rowIndex는 0부터 시작하므로 헤더 고려 +2
    const colMap = { "name": 3, "grade": 4, "role": 4 }; // 시트 구조에 맞게 조정 필요
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
