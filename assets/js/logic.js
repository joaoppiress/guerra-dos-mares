const GDM_LOGIC = {
  other(owner){ return owner === 'player1' ? 'player2' : 'player1'; },
  home(owner){ return GDM_CONFIG.zones[owner]; },
  coord(row,col){ return `${String.fromCharCode(65 + (col % GDM_CONFIG.grid.zoneWidth))}${row + 1}`; },
  coordWithZone(row,col){
    const names={player1:'Oceano do Jogador 1',neutral:'Oceano Neutro',player2:'Oceano do Jogador 2'};
    return `${names[this.zone(col)]} ${this.coord(row,col)}`;
  },
  zone(col){ return col < 10 ? 'player1' : col < 20 ? 'neutral' : 'player2'; },
  cells(row,col,size,orientation){
    const out=[];
    for(let i=0;i<size;i++) out.push(orientation==='horizontal' ? {row,col:col+i} : {row:row+i,col});
    return out;
  },
  inBounds(cells){ return cells.every(c=>c.row>=0&&c.row<10&&c.col>=0&&c.col<30); },
  shipAt(state,row,col,owner=null){
    const owners=owner?[owner]:['player1','player2'];
    for(const o of owners){
      for(const s of state.ships[o]){
        if(!s.destroyed && s.cells.some(c=>c.row===row&&c.col===col)) return s;
      }
    }
    return null;
  },
  trapAt(state,row,col,owner=null){
    return state.traps.find(t=>t.active&&t.row===row&&t.col===col&&(!owner||t.owner===owner))||null;
  },
  occupied(state,cells,ignoreShipId=null){
    for(const o of ['player1','player2']){
      for(const s of state.ships[o]){
        if(s.destroyed || s.uid===ignoreShipId) continue;
        if(s.cells.some(sc=>cells.some(c=>c.row===sc.row&&c.col===sc.col))) return true;
      }
    }
    return state.traps.some(t=>t.active&&cells.some(c=>c.row===t.row&&c.col===t.col));
  },
  canPlace(state,ship,row,col,orientation){
    const cells=this.cells(row,col,ship.size,orientation);
    if(!this.inBounds(cells)) return false;
    const h=this.home(ship.owner);
    if(!cells.every(c=>c.col>=h.minCol&&c.col<=h.maxCol)) return false;
    return !this.occupied(state,cells,ship.uid);
  },
  refresh(ship){ ship.cells=this.cells(ship.row,ship.col,ship.size,ship.orientation); },
  canMove(state,ship,dr,dc){
    const cells=this.cells(ship.row+dr,ship.col+dc,ship.size,ship.orientation);
    return this.inBounds(cells) && !this.occupied(state,cells,ship.uid);
  },
  chebyshev(a,b){ return Math.max(Math.abs(a.row-b.row),Math.abs(a.col-b.col)); },
  distanceToShip(cell,ship){ return Math.min(...ship.cells.map(c=>this.chebyshev(cell,c))); },
  spendCharge(ship,round){
    if(ship.availableCharges<=0) return false;
    ship.availableCharges--;
    ship.rechargeQueue.push(round+2);
    return true;
  },
  recoverCharges(ship,round){
    const due=ship.rechargeQueue.filter(r=>r<=round).length;
    if(due){
      ship.availableCharges=Math.min(ship.maxCharges,ship.availableCharges+due);
      ship.rechargeQueue=ship.rechargeQueue.filter(r=>r>round);
    }
  },
  objectId(obj,type){ return `${type}:${obj.uid}`; }
};
