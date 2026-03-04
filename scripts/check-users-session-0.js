const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function checkUsersSession0() {
    try {
        console.log('Vérification des utilisateurs avec Session = 0...\n');
        
        const users = await prisma.tUtilisateurs.findMany({
            where: { session: 0 },
            select: {
                id: true,
                codeUtilisateur: true,
                nomUtilisateur: true,
                session: true
            }
        });
        
        console.log(`Total: ${users.length} utilisateur(s) avec Session = 0\n`);
        users.forEach(u => {
            console.log(`  - ID ${u.id}: ${u.nomUtilisateur} (Code: ${u.codeUtilisateur})`);
        });
        
        console.log('\nVérification de VSessions pour Session 0:');
        const sessions = await prisma.$queryRaw`
            SELECT * FROM VSessions WHERE ID_Session = 0
        `;
        console.log(`VSessions retourne ${sessions.length} ligne(s) pour Session 0\n`);
        sessions.forEach(s => {
            console.log(`  - Session ${s.ID_Session}: Utilisateur ${s.ID_Utilisateur} (${s.Nom_Utilisateur})`);
        });
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsersSession0();
