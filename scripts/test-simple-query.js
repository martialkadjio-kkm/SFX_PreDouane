// Test simple avec une requête basique
console.log('Test de requête VDossiers simple...');

// Simuler ce que fait getAllDossiers
const testQuery = `
    SELECT * FROM VDossiers
    WHERE 1=1
    ORDER BY [ID Dossier] DESC
`;

console.log('Requête à tester:');
console.log(testQuery);
console.log('\nSi cette requête fonctionne en SQL Server, alors le problème est résolu.');
console.log('Sinon, nous devons identifier les vrais noms de colonnes.');