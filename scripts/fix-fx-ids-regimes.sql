-- Corriger la fonction fx_IDs_RegimesDeclarations pour ignorer le filtre Regime Douanier quand il vaut 0

DROP FUNCTION IF EXISTS [dbo].[fx_IDs_RegimesDeclarations];
GO

CREATE FUNCTION [dbo].[fx_IDs_RegimesDeclarations]( 
    @ID_Client int, 
    @TextJoin nvarchar(max), 
    @Delimiter nvarchar(1)='|', 
    @ID_RegimeDouanier int = 0
)
RETURNS TABLE
AS
RETURN
(
    WITH DISTINCT_LIST ([Value]) AS
    (
        SELECT DISTINCT CAST([value] as numeric (24,6)) FROM string_split(@TextJoin, @Delimiter)
    )

    SELECT B.[ID Regime Declaration] AS [ID], B.[Taux DC] AS [Taux_DC]
    FROM DISTINCT_LIST A 
        INNER JOIN dbo.TRegimesDeclarations B ON A.[Value] = B.[Taux DC]
        INNER JOIN dbo.TRegimesClients C ON B.[ID Regime Declaration] = C.[Regime Declaration]
    WHERE (C.[Client] = @ID_Client) 
        AND (@ID_RegimeDouanier = 0 OR B.[Regime Douanier] = @ID_RegimeDouanier)
)
GO

-- Tester la fonction corrigée
DECLARE @ClientID INT;
SELECT @ClientID = [ID Client] FROM [dbo].[TClients] WHERE [Nom Client] LIKE '%Edwin%';

PRINT 'Test après correction:';
SELECT [ID], [Taux_DC], CAST([Taux_DC] AS VARCHAR(20)) AS [Taux_DC_String]
FROM [dbo].[fx_IDs_RegimesDeclarations](@ClientID, '0.7|0.5|0.8|0.25', '|', 0);
