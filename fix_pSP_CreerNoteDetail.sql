USE [SFX_PreDouane]
GO

CREATE OR ALTER PROCEDURE [dbo].[pSP_CreerNoteDetail]
                @Id_Dossier int
                ,@DateDeclaration datetime2(7)
                ,@Id_DeviseNoteDetail int
                ,@RoundDigit int=2
AS
BEGIN
                SET NOCOUNT ON;
                DECLARE @Message nvarchar(1000)
                DECLARE @TAUX_DEVISES TABLE ([ID_Devise] int PRIMARY KEY NOT NULL, [Code_Devise] nvarchar(5) NOT NULL, [Taux_Change] numeric(24,6))

                IF NOT EXISTS(SELECT TOP (1) 1 FROM TDossiers WHERE ([ID Dossier]=@Id_Dossier) AND ([Statut Dossier]=0))
                BEGIN
                               SET @Message='FILE IS NOT IN PROGRESS'
                               RAISERROR (@Message, 16, 1) WITH LOG;
                               RETURN
                END

                INSERT INTO @TAUX_DEVISES([ID_Devise],[Code_Devise],[Taux_Change])
                SELECT [ID_Devise], [Code_Devise], [Taux_Change]
                FROM [dbo].[fx_EvalTauxChangeDossier](@Id_Dossier, @Id_DeviseNoteDetail, @DateDeclaration)

                DECLARE @NbreDevises int=0, @DevisesSansTauxDeChange nvarchar(200)=N''
                SELECT @NbreDevises=COUNT(*), @DevisesSansTauxDeChange=STRING_AGG(IIF([Taux_Change] IS NULL,[Code_Devise], NULL),N' / ')
                FROM @TAUX_DEVISES

                IF (@NbreDevises=0)
                BEGIN
                               SET @Message='NO EXCHANGE RATE AT ' + FORMAT(@DateDeclaration,'dd-MMM-yy') + ' FOR THIS ENTITY'
                               RAISERROR (@Message, 16, 1) WITH LOG;
                               RETURN
                END

                IF (@DevisesSansTauxDeChange<>N'')
                BEGIN
                               SET @Message='MISSING EXCHANGE RATE FOR CURRENCIES ' + @DevisesSansTauxDeChange + ' AT ' + FORMAT(@DateDeclaration,'dd-MMM-yy') + ' FOR THIS ENTITY'
                               RAISERROR (@Message, 16, 1) WITH LOG;
                               RETURN
                END

                DECLARE @NbrePaquetagePesee int, @PoidsBrutPesee numeric(24,2), @PoidsNetPesee numeric(24,2), @VolumePesee numeric(24,2)
                SELECT @NbrePaquetagePesee=[Nbre Paquetage Pesee], @PoidsBrutPesee=[Poids Brut Pesee], @PoidsNetPesee=[Poids Net Pesee], @VolumePesee=[Volume Pesee]
                FROM TDossiers
                WHERE [ID Dossier]=@Id_Dossier

                IF (@NbrePaquetagePesee=0) OR (@PoidsBrutPesee=0)
                BEGIN
                               SET @Message='MISSING Gross Weight or Package number on File Header'
                               RAISERROR (@Message, 16, 1) WITH LOG;
                               RETURN
                END

                DECLARE @ValeurTotaleColisage numeric(24,2)=0
                SELECT @ValeurTotaleColisage=SUM([Qte Colis]*[Prix Unitaire Colis])
                FROM TColisageDossiers
                WHERE [Dossier]=@Id_Dossier

                IF @ValeurTotaleColisage=0
                BEGIN
                               SET @Message='MISSING PACKING LIST ON FILE'
                               RAISERROR (@Message, 16, 1) WITH LOG;
                               RETURN
                END

                IF EXISTS(SELECT TOP 1 [ID Colisage Dossier] FROM TColisageDossiers WHERE ([Dossier]=@Id_Dossier) AND (([HS Code] IS NULL) OR ([Regime Declaration] IS NULL)))
                BEGIN
                               DECLARE @DescriptionsAvecNull nvarchar(max)=N''
                               SELECT @DescriptionsAvecNull=STRING_AGG(CHAR(34) + [Description Colis] + CHAR(34),N' , ')
                               FROM (
                                               SELECT DISTINCT [Description Colis]
                                               FROM TColisageDossiers
                                               WHERE ([Dossier]=@Id_Dossier) AND (([HS Code] IS NULL) OR ([Regime Declaration] IS NULL))
                               ) T
                               SET @Message='MISSING HS CODE OR REGIME FOR LINES {' + @DescriptionsAvecNull + '}'
                               RAISERROR (@Message, 16, 1) WITH LOG;
                               RETURN
                END

                BEGIN TRY
                BEGIN TRANSACTION;

                               EXEC [dbo].[pSP_CalculeAjustementValeurColisage] @Id_Dossier

                               DECLARE @ValeurTotaleColisageND numeric(24,2)=0
                               SELECT @ValeurTotaleColisageND=SUM((A.[Qte Colis]*A.[Prix Unitaire Colis] + A.[Ajustement Valeur]) * T.[Taux_Change])
                               FROM TColisageDossiers A
                               INNER JOIN @TAUX_DEVISES T ON A.[Devise]=T.[ID_Devise]
                               WHERE A.[Dossier]=@Id_Dossier AND A.[HS Code]<>0

                               ;WITH TMP_NOTES_DETAIL_100 ([Colisage Dossier],[Regime],[Qte Colis],[Valeur],[Nbre Paquetage],[Base Poids Brut],[Base Poids Net],[Base Volume]) AS
                               (
                                               SELECT A.[ID Colisage Dossier], N'TTC', A.[Qte Colis]
                                                               ,(A.[Qte Colis]*A.[Prix Unitaire Colis] + A.[Ajustement Valeur]) * T.[Taux_Change]
                                                               ,@NbrePaquetagePesee*(A.[Qte Colis]*A.[Prix Unitaire Colis] + A.[Ajustement Valeur]) * T.[Taux_Change]/@ValeurTotaleColisageND
                                                               ,@PoidsBrutPesee*(A.[Qte Colis]*A.[Prix Unitaire Colis] + A.[Ajustement Valeur]) * T.[Taux_Change]/@ValeurTotaleColisageND
                                                               ,@PoidsNetPesee*(A.[Qte Colis]*A.[Prix Unitaire Colis] + A.[Ajustement Valeur]) * T.[Taux_Change]/@ValeurTotaleColisageND
                                                               ,@VolumePesee*(A.[Qte Colis]*A.[Prix Unitaire Colis] + A.[Ajustement Valeur]) * T.[Taux_Change]/@ValeurTotaleColisageND
                                               FROM [dbo].[TColisageDossiers] A
                                               INNER JOIN dbo.TRegimesDeclarations B ON A.[Regime Declaration]=B.[ID Regime Declaration]
                                               INNER JOIN @TAUX_DEVISES T ON A.[Devise]=T.[ID_Devise]
                                               WHERE ([Dossier]=@Id_Dossier) AND (A.[HS Code]<>0) AND (B.[Taux Regime]=-2)

                                               UNION ALL
                                               SELECT A.[ID Colisage Dossier], N'100% TR', A.[Qte Colis]
                                                               ,(A.[Qte Colis]*A.[Prix Unitaire Colis] + A.[Ajustement Valeur]) * T.[Taux_Change]
                                                               ,@NbrePaquetagePesee*(A.[Qte Colis]*A.[Prix Unitaire Colis] + A.[Ajustement Valeur]) * T.[Taux_Change]/@ValeurTotaleColisageND
                                                               ,@PoidsBrutPesee*(A.[Qte Colis]*A.[Prix Unitaire Colis] + A.[Ajustement Valeur]) * T.[Taux_Change]/@ValeurTotaleColisageND
                                                               ,@PoidsNetPesee*(A.[Qte Colis]*A.[Prix Unitaire Colis] + A.[Ajustement Valeur]) * T.[Taux_Change]/@ValeurTotaleColisageND
                                                               ,@VolumePesee*(A.[Qte Colis]*A.[Prix Unitaire Colis] + A.[Ajustement Valeur]) * T.[Taux_Change]/@ValeurTotaleColisageND
                                               FROM [dbo].[TColisageDossiers] A
                                               INNER JOIN dbo.TRegimesDeclarations B ON A.[Regime Declaration]=B.[ID Regime Declaration]
                                               INNER JOIN @TAUX_DEVISES T ON A.[Devise]=T.[ID_Devise]
                                               WHERE ([Dossier]=@Id_Dossier) AND (A.[HS Code]<>0) AND (B.[Taux Regime]=-1)

                                               UNION ALL
                                               SELECT A.[ID Colisage Dossier], N'EXO', A.[Qte Colis]
                                                               ,(A.[Qte Colis]*A.[Prix Unitaire Colis] + A.[Ajustement Valeur]) * T.[Taux_Change]
                                                               ,@NbrePaquetagePesee*(A.[Qte Colis]*A.[Prix Unitaire Colis] + A.[Ajustement Valeur]) * T.[Taux_Change]/@ValeurTotaleColisageND
                                                               ,@PoidsBrutPesee*(A.[Qte Colis]*A.[Prix Unitaire Colis] + A.[Ajustement Valeur]) * T.[Taux_Change]/@ValeurTotaleColisageND
                                                               ,@PoidsNetPesee*(A.[Qte Colis]*A.[Prix Unitaire Colis] + A.[Ajustement Valeur]) * T.[Taux_Change]/@ValeurTotaleColisageND
                                                               ,@VolumePesee*(A.[Qte Colis]*A.[Prix Unitaire Colis] + A.[Ajustement Valeur]) * T.[Taux_Change]/@ValeurTotaleColisageND
                                               FROM [dbo].[TColisageDossiers] A
                                               INNER JOIN dbo.TRegimesDeclarations B ON A.[Regime Declaration]=B.[ID Regime Declaration]
                                               INNER JOIN @TAUX_DEVISES T ON A.[Devise]=T.[ID_Devise]
                                               WHERE ([Dossier]=@Id_Dossier) AND (A.[HS Code]<>0) AND (B.[Taux Regime]=0)

                                               UNION ALL
                                               SELECT A.[ID Colisage Dossier], N'100% DC', A.[Qte Colis]
                                                               ,(A.[Qte Colis]*A.[Prix Unitaire Colis] + A.[Ajustement Valeur]) * T.[Taux_Change]
                                                               ,@NbrePaquetagePesee*(A.[Qte Colis]*A.[Prix Unitaire Colis] + A.[Ajustement Valeur]) * T.[Taux_Change]/@ValeurTotaleColisageND
                                                               ,@PoidsBrutPesee*(A.[Qte Colis]*A.[Prix Unitaire Colis] + A.[Ajustement Valeur]) * T.[Taux_Change]/@ValeurTotaleColisageND
                                                               ,@PoidsNetPesee*(A.[Qte Colis]*A.[Prix Unitaire Colis] + A.[Ajustement Valeur]) * T.[Taux_Change]/@ValeurTotaleColisageND
                                                               ,@VolumePesee*(A.[Qte Colis]*A.[Prix Unitaire Colis] + A.[Ajustement Valeur]) * T.[Taux_Change]/@ValeurTotaleColisageND
                                               FROM [dbo].[TColisageDossiers] A
                                               INNER JOIN dbo.TRegimesDeclarations B ON A.[Regime Declaration]=B.[ID Regime Declaration]
                                               INNER JOIN @TAUX_DEVISES T ON A.[Devise]=T.[ID_Devise]
                                               WHERE ([Dossier]=@Id_Dossier) AND (A.[HS Code]<>0) AND (B.[Taux Regime]=1)
                               ),
                               CTE_VALEUR_GLOBALE AS
                               (
                                               SELECT A.[ID Colisage Dossier] AS [Colisage Dossier]
                                                               ,(A.[Qte Colis]*A.[Prix Unitaire Colis] + A.[Ajustement Valeur]) * T.[Taux_Change] AS [Valeur Globale]
                                                               ,B.[Taux Regime]
                                               FROM [dbo].[TColisageDossiers] A
                                               INNER JOIN dbo.TRegimesDeclarations B ON A.[Regime Declaration]=B.[ID Regime Declaration]
                                               INNER JOIN @TAUX_DEVISES T ON A.[Devise]=T.[ID_Devise]
                                               WHERE ([Dossier]=@Id_Dossier) AND (A.[HS Code]<>0) AND (B.[Taux Regime]>0 AND B.[Taux Regime]<1)
                               ),
                               CTE_VALEUR_DC AS
                               (
                                               SELECT [Colisage Dossier], [Valeur Globale], [Taux Regime]
                                                               ,ROUND([Valeur Globale]*[Taux Regime],@RoundDigit) AS [Valeur DC]
                                               FROM CTE_VALEUR_GLOBALE
                               ),
                               TMP_NOTES_DETAIL_RATIO ([Colisage Dossier],[Regime],[Qte Colis],[Valeur],[Nbre Paquetage],[Base Poids Brut],[Base Poids Net],[Base Volume]) AS
                               (
                                               SELECT A.[ID Colisage Dossier]
                                                               ,FORMAT(B.[Taux Regime],'P') + N' DC'
                                                               ,A.[Qte Colis]*B.[Taux Regime]
                                                               ,B.[Valeur DC]
                                                               ,@NbrePaquetagePesee*B.[Valeur Globale]*B.[Taux Regime]/@ValeurTotaleColisageND
                                                               ,@PoidsBrutPesee*B.[Valeur Globale]*B.[Taux Regime]/@ValeurTotaleColisageND
                                                               ,@PoidsNetPesee*B.[Valeur Globale]*B.[Taux Regime]/@ValeurTotaleColisageND
                                                               ,@VolumePesee*B.[Valeur Globale]*B.[Taux Regime]/@ValeurTotaleColisageND
                                               FROM [dbo].[TColisageDossiers] A
                                               INNER JOIN CTE_VALEUR_DC B ON A.[ID Colisage Dossier]=B.[Colisage Dossier]

                                               UNION ALL
                                               SELECT A.[ID Colisage Dossier]
                                                               ,FORMAT(1-B.[Taux Regime],'P') + N'TR'
                                                               ,A.[Qte Colis]*(1-B.[Taux Regime])
                                                               ,B.[Valeur Globale]-B.[Valeur DC]
                                                               ,@NbrePaquetagePesee*B.[Valeur Globale]*(1-B.[Taux Regime])/@ValeurTotaleColisageND
                                                               ,@PoidsBrutPesee*B.[Valeur Globale]*(1-B.[Taux Regime])/@ValeurTotaleColisageND
                                                               ,@PoidsNetPesee*B.[Valeur Globale]*(1-B.[Taux Regime])/@ValeurTotaleColisageND
                                                               ,@VolumePesee*B.[Valeur Globale]*(1-B.[Taux Regime])/@ValeurTotaleColisageND
                                               FROM [dbo].[TColisageDossiers] A
                                               INNER JOIN CTE_VALEUR_DC B ON A.[ID Colisage Dossier]=B.[Colisage Dossier]
                               )

                               INSERT INTO [dbo].[TNotesDetail]
                                               ([Colisage Dossier],[Regime],[Qte Colis],[Valeur],[Nbre Paquetage],[Base Poids Brut],[Base Poids Net],[Base Volume])
                               SELECT [Colisage Dossier],[Regime]
                                               ,GREATEST([Qte Colis],0.01)
                                               ,GREATEST([Valeur],0.01)
                                               ,GREATEST([Nbre Paquetage],0.01)
                                               ,GREATEST([Base Poids Brut],0.01)
                                               ,GREATEST([Base Poids Net],0.01)
                                               ,GREATEST([Base Volume],0.01)
                               FROM TMP_NOTES_DETAIL_100
                               UNION ALL
                               SELECT [Colisage Dossier],[Regime]
                                               ,GREATEST([Qte Colis],0.01)
                                               ,GREATEST([Valeur],0.01)
                                               ,GREATEST([Nbre Paquetage],0.01)
                                               ,GREATEST([Base Poids Brut],0.01)
                                               ,GREATEST([Base Poids Net],0.01)
                                               ,GREATEST([Base Volume],0.01)
                               FROM TMP_NOTES_DETAIL_RATIO

                               DECLARE @TotalRowsPaquetage numeric(24,2), @TotalRowsPoidsBrut numeric(24,2), @TotalRowsPoidsNet numeric(24,2), @TotalRowsVolume numeric(24,2)
                               DECLARE @NoteDetailId int

                               SELECT @TotalRowsPaquetage=SUM([Nbre Paquetage])
                                               ,@TotalRowsPoidsBrut=SUM([Base Poids Brut])
                                               ,@TotalRowsPoidsNet=SUM([Base Poids Net])
                                               ,@TotalRowsVolume=SUM([Base Volume])
                               FROM TNotesDetail A
                               INNER JOIN TColisageDossiers B ON A.[Colisage Dossier]=B.[ID Colisage Dossier]
                               WHERE B.Dossier=@Id_Dossier

                               IF (@NbrePaquetagePesee<>@TotalRowsPaquetage)
                               BEGIN
                                               SELECT TOP 1 @NoteDetailId=A.[ID Note Detail]
                                               FROM TNotesDetail A INNER JOIN TColisageDossiers B ON A.[Colisage Dossier]=B.[ID Colisage Dossier]
                                               WHERE B.Dossier=@Id_Dossier ORDER BY [Nbre Paquetage] DESC;
                                               UPDATE TNotesDetail SET [Nbre Paquetage]=[Nbre Paquetage]+@NbrePaquetagePesee-@TotalRowsPaquetage WHERE [ID Note Detail]=@NoteDetailId
                               END

                               IF (@PoidsBrutPesee<>@TotalRowsPoidsBrut)
                               BEGIN
                                               SELECT TOP 1 @NoteDetailId=A.[ID Note Detail]
                                               FROM TNotesDetail A INNER JOIN TColisageDossiers B ON A.[Colisage Dossier]=B.[ID Colisage Dossier]
                                               WHERE B.Dossier=@Id_Dossier ORDER BY [Base Poids Brut] DESC;
                                               UPDATE TNotesDetail SET [Base Poids Brut]=[Base Poids Brut]+@PoidsBrutPesee-@TotalRowsPoidsBrut WHERE [ID Note Detail]=@NoteDetailId
                               END

                               IF (@PoidsNetPesee<>@TotalRowsPoidsNet)
                               BEGIN
                                               SELECT TOP 1 @NoteDetailId=A.[ID Note Detail]
                                               FROM TNotesDetail A INNER JOIN TColisageDossiers B ON A.[Colisage Dossier]=B.[ID Colisage Dossier]
                                               WHERE B.Dossier=@Id_Dossier ORDER BY [Base Poids Net] DESC;
                                               UPDATE TNotesDetail SET [Base Poids Net]=[Base Poids Net]+@PoidsNetPesee-@TotalRowsPoidsNet WHERE [ID Note Detail]=@NoteDetailId
                               END

                               IF (@VolumePesee<>@TotalRowsVolume)
                               BEGIN
                                               SELECT TOP 1 @NoteDetailId=A.[ID Note Detail]
                                               FROM TNotesDetail A INNER JOIN TColisageDossiers B ON A.[Colisage Dossier]=B.[ID Colisage Dossier]
                                               WHERE B.Dossier=@Id_Dossier ORDER BY [Base Volume] DESC;
                                               UPDATE TNotesDetail SET [Base Volume]=[Base Volume]+@VolumePesee-@TotalRowsVolume WHERE [ID Note Detail]=@NoteDetailId
                               END

                               UPDATE dbo.TDossiers SET [Statut Dossier]=-1 WHERE [ID Dossier]=@Id_Dossier

                               INSERT INTO dbo.TEtapesDossiers ([Dossier],[Etape Dossier],[Date Debut],[Date Fin])
                               VALUES (@Id_Dossier, 1, GETDATE(), GETDATE())

                               EXEC [dbo].[pSP_RecalculeDerniereEtapeDossier] @Id_Dossier

                               DECLARE @Id_Convertion int
                               SELECT @Id_Convertion=co.[ID Convertion]
                               FROM TConvertions co
                               INNER JOIN TBranches br ON co.[Entite]=br.[Entite] OR co.[Entite]=0
                               INNER JOIN TDossiers dr ON br.[ID Branche]=dr.[Branche]
                               WHERE (dr.[ID Dossier]=@Id_Dossier)
                                 AND CAST(co.[Date Convertion] AS DATE)=CAST(@DateDeclaration AS DATE)

                               UPDATE dbo.TDossiers SET [Convertion]=@Id_Convertion, [Devise Note Detail]=@Id_DeviseNoteDetail WHERE [ID Dossier]=@Id_Dossier

                COMMIT TRANSACTION;
                END TRY
                BEGIN CATCH
                               IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
                               SET @Message=ERROR_MESSAGE()
                               RAISERROR (@Message, 16, 1) WITH LOG;
                               RETURN
                END CATCH;
END
GO
