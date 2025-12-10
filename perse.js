// parse.js
function parseBRD(brdString) {
  const boards = [];
  const normalizedText = brdString.replace(/\r\n/g,'\n').replace(/\r/g,'\n');
  const sections = normalizedText.split('///');

  for(const section of sections) {
    const lines = section.split('\n').map(l=>l.trim()).filter(l=>l);
    if(lines.length===0) continue;

    const sizeMatch = lines[0].match(/\[(\d+)x(\d+)\]/);
    if(!sizeMatch) continue;
    const rows = parseInt(sizeMatch[1]);
    const cols = parseInt(sizeMatch[2]);

    const cells = [];
    const codes = [];

    for(let i=1;i<lines.length;i++){
      const line = lines[i];
      const codeMatch = line.match(/\(([\dA-Fa-f\-]+)\)/);
      if(codeMatch) {
        codes.push(codeMatch[1]);
      } else {
        const row = [];
        for(const ch of line){
          if(ch==='0') row.push({mine:false, open:false});
          else if(ch==='1') row.push({mine:true, open:false});
          else if(ch==='-') row.push({mine:false, open:true});
        }
        cells.push(row);
      }
    }

    boards.push({rows, cols, cells, codes});
  }

  return boards;
}

function loadBRDFileViaFetch(url, callback){
  fetch(url)
    .then(res=>{
      if(!res.ok) throw new Error('ファイル読み込み失敗');
      return res.text();
    })
    .then(text=>{
      const boards = parseBRD(text);
      callback(boards);
    })
    .catch(err=>console.error(err));
}
