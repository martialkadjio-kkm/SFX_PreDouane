// Tester ce que retourne VNotesDetail
const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function test() {
    try {
        const dossierId = 1;
        
        const notes = await prisma.$queryRaw`
            SELECT TOP 3 * FROM VNotesDetail
            WHERE ID_Dossier = ${dossierId}
        `;
        
        console.log('Nombre de notes:', notes.length);
        console.log('\nPremière note:');
        const note = notes[0];
        
        for (const key in note) {
            const value = note[key];
            console.log(`${key}: ${value} (type: ${typeof value}, constructor: ${value?.constructor?.name})`);
        }
        
        console.log('\n=== Test JSON.stringify ===');
        const json = JSON.stringify(notes[0]);
        console.log(json);
        
        console.log('\n=== Test JSON.parse(JSON.stringify()) ===');
        const parsed = JSON.parse(JSON.stringify(notes[0]));
        console.log('Base_Qte:', parsed.Base_Qte);
        console.log('Base_PU:', parsed.Base_PU);
        
    } catch (error) {
        console.error('Erreur:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

test();
