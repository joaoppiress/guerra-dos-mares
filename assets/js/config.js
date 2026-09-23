const GDM_CONFIG = Object.freeze({
  version: 'sprite-only-hotseat-1.3.0-ui-naval',
  grid: { rows: 10, cols: 30, zoneWidth: 10 },
  zones: {
    player1: { minCol: 0, maxCol: 9 },
    neutral: { minCol: 10, maxCol: 19 },
    player2: { minCol: 20, maxCol: 29 }
  },
  difficulties: {
    facil:   { id:'facil',   label:'FÁCIL',   coins:5000 },
    medio:   { id:'medio',   label:'MÉDIO',   coins:3600 },
    dificil: { id:'dificil', label:'DIFÍCIL', coins:2700 }
  },
  ships: {
    'trap-layer': { id:'trap-layer', name:'LANÇA-ARMADILHAS', price:1200, hp:2000, size:5, charges:1, damage:1500, chargeType:'trap', trapStock:3 },
    battleship:   { id:'battleship', name:'ENCOURAÇADO',      price:900,  hp:1500, size:4, charges:1, damage:900,  chargeType:'missile' },
    cruiser:      { id:'cruiser',    name:'CRUZADOR',         price:600,  hp:900,  size:3, charges:2, damage:300,  chargeType:'missile' },
    destroyer:    { id:'destroyer',  name:'DESTROIER',        price:300,  hp:600,  size:2, charges:3, damage:170,  chargeType:'missile' }
  },
  radar: { radius: 3 },
  traps: { launchRadius: 7, damage: 1500 },
  animation: { waterFrameMs: 220, explosionFrameMs: 65, bobFrameMs: 520 },
  input: { dragThreshold: 6 }
});

function normalizeDifficulty(value){
  const raw=String(value||'').trim().toLowerCase();
  const aliases={
    'facil':'facil','fácil':'facil','2':'facil',
    'medio':'medio','médio':'medio','3':'medio',
    'dificil':'dificil','difícil':'dificil','4':'dificil'
  };
  return aliases[raw]||null;
}

function getExplicitPlatformDifficulty(){
  try{
    const queryValue=new URLSearchParams(window.location.search).get('difficulty');
    const fromQuery=normalizeDifficulty(queryValue);
    if(fromQuery) return fromQuery;
  }catch(_error){}
  return normalizeDifficulty(window.GDM_PLATFORM_DIFFICULTY);
}

function hasPlatformDifficulty(){
  return Boolean(getExplicitPlatformDifficulty());
}

function getPlatformDifficulty(){
  const explicit=getExplicitPlatformDifficulty();
  if(explicit) return explicit;
  const local=normalizeDifficulty(window.GDM_GAME?.state?.difficulty);
  return local||'medio';
}
