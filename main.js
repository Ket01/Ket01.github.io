import Decimal from "./decimal.mjs";

//レベルごとのショップの確率
let shop_probability = [
  [100,0,0,0,0],
  [100,0,0,0,0],
  [75,25,0,0,0],
  [55,30,15,0,0,],
  [45,33,20,2,0],
  [30,40,25,5,0],
  [19,30,40,10,1],
  [17,24,32,24,3],
  [15,18,25,30,12],
  [5,10,20,40,25]
];
let shop_probability_header = ["レベル","１コスト","２コスト","３コスト","４コスト","５コスト"];
const table = document.getElementById("Table");
table.classList.add("Table");
// ヘッダー
const thead = document.createElement("thead");
thead.classList.add("Table-Head");

const headerRow = document.createElement("tr");
shop_probability_header.forEach(text => {
  const th = document.createElement("th");
  th.textContent = text;
  th.classList.add("Table-Head-Row-Cell");
  headerRow.appendChild(th);
});
thead.appendChild(headerRow);
table.appendChild(thead);

// ボディ
const tbody = document.createElement("tbody");
shop_probability.forEach((rowData,index) => {
  const row = document.createElement("tr");
  row.classList.add("Table-Body-Row");
  const td = document.createElement("td");
  td.textContent = index+1;
  td.classList.add("Table-Body-Row-Cell");
  td.style.fontWeight="bolder";
  row.appendChild(td);
  rowData.forEach(text => {
    const td = document.createElement("td");
    td.textContent = text;
    td.classList.add("Table-Body-Row-Cell")
    row.appendChild(td);
  });
  tbody.appendChild(row);
});
table.appendChild(tbody);


function calculate() {
  const MAXLEVLE = 10
  const MAXCOST = 5
  const class_cost = ["cost1","cost2","cost3","cost4","cost5"];

  /*     前提条件      */
  //1~5コストの種類&数
  let all_characters = Array.from({ length: MAXCOST }, () => new Array(2).fill(0));
  for(let i=0;i<all_characters.length;i++){
    all_characters[i][0] = parseInt(document.querySelector(`form#all_characters input.${class_cost[i]}.character_type`).value);
    all_characters[i][1] = parseInt(document.querySelector(`form#all_characters input.${class_cost[i]}.character_count`).value);
  }
  //すでに引かれている同じコストのキャラ
  let same_cost_owned_characters = parseInt(document.querySelector(`form#same_cost_owned_characters input`).value);
  
  /*     処理内容      */
  //計算するモード
  let mode = document.querySelector(`form#select_mode input[name="select_mode"]:checked`).value;
  //現在のレベル
  let player_level = parseInt(document.querySelector(`form#player_level input[name="player_level"]:checked`).value);
  //目的のキャラのコストと数
  let demand_character_cost = parseInt(document.querySelector(`form#demand_character_cost input[name="demand_character_cost"]:checked`).value);
  let taked_demand_character_count =parseInt(document.querySelector(`form#demand_character_count input`).value);
  //リロール回数
  let reroll_count = parseInt(document.querySelector(`form#reroll_count input`).value);
  //何体までの確率
  let calc_character_count = parseInt(document.querySelector(`form#max_character_count input`).value);

  if(reroll_count*calc_character_count>=5e4){
    const resultDiv = document.getElementById("answer");
    resultDiv.innerHTML = `<p>リロール回数または計算する最大枚数を減らしてください<dp>（かけ合わせて50,000以下）</p>`;
    return 0;
  }
  if(all_characters[demand_character_cost-1][1]<taked_demand_character_count){
    const resultDiv = document.getElementById("answer");
    resultDiv.innerHTML = `<p>目的のキャラの枚数がマイナスです。</p>`;
    return 0;
  }
  if(all_characters[demand_character_cost-1][1]*(all_characters[demand_character_cost-1][0]-1)<same_cost_owned_characters){
    const resultDiv = document.getElementById("answer");
    resultDiv.innerHTML = `<p>同じコストのキャラが多すぎます。入力しなおしてください。</p>`;
    return 0;
  }

  if(mode=="probability"){
    let dp = new Array(calc_character_count+1).fill(new Decimal(0));
    dp[0] = new Decimal(1);
    for(let reroll_i=0;reroll_i<reroll_count;reroll_i++){
      let _dp = new Array(calc_character_count+1).fill(new Decimal(0));

      let subdp = Array.from({ length: dp.length }, () => Array.from({ length: 6 }, () => new Decimal(0)));
      for(let i=0;i<dp.length;i++) subdp[i][0] = dp[i];
      for(let sub_reroll_i=0;sub_reroll_i<5;sub_reroll_i++){
        let _subdp = Array.from({ length: dp.length }, () => Array.from({ length: 6 }, () => new Decimal(0)));
        for(let i=0;i<subdp.length;i++)for(let j=0;j<6;j++){
          _subdp[i][j]   = _subdp[i][j].plus(subdp[i][j].times(new Decimal(1)-new Decimal(shop_probability[player_level-1][demand_character_cost-1]).div(100)))
          let win_in_certain_cost = new Decimal(all_characters[demand_character_cost-1][1]-taked_demand_character_count-i).div(all_characters[demand_character_cost-1][0]*all_characters[demand_character_cost-1][1]-taked_demand_character_count-same_cost_owned_characters-i-j)
          _subdp[Math.min(i+1,subdp.length-1)][j] = _subdp[Math.min(i+1,subdp.length-1)][j].plus(subdp[i][j].times(new Decimal(shop_probability[player_level-1][demand_character_cost-1]).div(100)).times(win_in_certain_cost))
          _subdp[i][Math.min(j+1,6-1)] = _subdp[i][Math.min(j+1,6-1)].plus(subdp[i][j].times(new Decimal(shop_probability[player_level-1][demand_character_cost-1]).div(100)).times(new Decimal(1)-win_in_certain_cost))
        }
        subdp = _subdp;
      }
      for(let i=0;i<dp.length;i++)for(let j=0;j<6;j++) _dp[i] = _dp[i].plus(subdp[i][j])
      dp = _dp;
    }
    for(let i=0;i<dp.length;i++) console.log(i,": ",dp[i].times(100).toNumber(), " %")
    const resultDiv = document.getElementById("answer");
    let result_html = ``
    for(let i=0;i<calc_character_count;i++) result_html += `<p>${i}体：${dp[i].times(100).toDecimalPlaces(4).toNumber()} %</p>`;
    result_html += `<p>${calc_character_count}体以上：${dp[calc_character_count].times(100).toDecimalPlaces(4).toNumber()} %</p>`;
    resultDiv.innerHTML = result_html
  }
  return 0;
}

window.calculate = calculate;
