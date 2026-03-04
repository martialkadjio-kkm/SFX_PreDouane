// Debug des actions du module colisage
const { 
  getAllHscodesForSelect,
  getAllDevisesForSelect,
  getAllPaysForSelect,
  getAllRegimeDeclarationsForSelect
} = require('../src/modules/colisage/server/actions');

async function debugActionsColisage() {
    try {
        console.log('=== DEBUG ACTIONS MODULE COLISAGE ===\n');
        
        console.log('1. Test getAllDevisesForSelect...');
        const devisesRes = await getAllDevisesForSelect();
        console.log('Devises:', devisesRes.success ? devisesRes.data.slice(0, 2) : devisesRes.error);
        
        console.log('\n2. Test getAllPaysForSelect...');
        const paysRes = await getAllPaysForSelect();
        console.log('Pays:', paysRes.success ? paysRes.data.slice(0, 2) : paysRes.error);
        
        console.log('\n3. Test getAllHscodesForSelect...');
        const hscodesRes = await getAllHscodesForSelect();
        console.log('HS Codes:', hscodesRes.success ? hscodesRes.data.slice(0, 2) : hscodesRes.error);
        
        console.log('\n4. Test getAllRegimeDeclarationsForSelect...');
        const regimesRes = await getAllRegimeDeclarationsForSelect();
        console.log('Régimes:', regimesRes.success ? regimesRes.data : regimesRes.error);
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
}

debugActionsColisage();