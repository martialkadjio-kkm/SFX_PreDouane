const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function checkVuesDisponibles() {
    try {
        console.log('=== VUES DISPONIBLES ===\n');
        
        const tables = await prisma.$queryRaw`
            SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME LIKE 'V%' 
            ORDER BY TABLE_NAME
        `;
        
        console.log('Vues disponibles:');
        tables.forEach(t => console.log('- ' + t.TABLE_NAME));
        
        // Chercher spécifiquement les vues pour les données de référence
        console.log('\n=== VUES POUR DONNÉES DE RÉFÉRENCE ===');
        
        const vuesRef = tables.filter(t => 
            t.TABLE_NAME.includes('Devise') || 
            t.TABLE_NAME.includes('Pays') || 
            t.TABLE_NAME.includes('HS') || 
            t.TABLE_NAME.includes('Regime')
        );
        
        console.log('Vues de référence trouvées:');
        vuesRef.forEach(v => console.log('- ' + v.TABLE_NAME));
        
    } catch (error) {
        console.error('Erreur:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkVuesDisponibles();