# Sprint Backlogs — Plateforme SIG Routière Intelligente

---

## Sprint 1 — Authentification & Gestion des Comptes

| ID (US) | User Story | ID Tache | Taches detaillees | Duree |
|---------|-----------|----------|-------------------|-------|
| US-1.1 | Inscription utilisateur | T1 | Creer la page d inscription avec les champs nom, prenom, e-mail, mot de passe, telephone et choix du role | 1 jour |
| | | T2 | Valider les informations saisies (e-mail unique, champs obligatoires, format correct) | |
| | | T3 | Sauvegarder le nouveau compte en base de donnees de maniere securisee | |
| US-1.2 | Verification e-mail | T1 | Envoyer automatiquement un e-mail de confirmation a chaque nouvelle inscription | 0.5 jour |
| | | T2 | Activer le compte lorsque l utilisateur clique sur le lien de confirmation recu | |
| US-1.3 | Connexion securisee | T1 | Creer la page de connexion avec les champs e-mail et mot de passe | 1 jour |
| | | T2 | Verifier les identifiants et ouvrir une session securisee pour l utilisateur | |
| | | T3 | Rediriger chaque utilisateur vers son espace dedie selon son role (admin, expert, agent) | |
| US-1.4 | Recuperation de compte | T1 | Creer le formulaire de demande de reinitialisation du mot de passe | 1 jour |
| | | T2 | Envoyer un lien de reinitialisation securise par e-mail, valable pendant une heure | |
| | | T3 | Permettre a l utilisateur de saisir et enregistrer son nouveau mot de passe | |
| US-1.5 | Gestion des agents | T1 | Afficher la liste des agents en attente de validation dans le tableau de bord administrateur | 1.5 jour |
| | | T2 | Permettre a l administrateur d approuver ou de rejeter chaque candidature d agent | |
| | | T3 | Assigner automatiquement la ville de l agent lors de son approbation | |
| | | T4 | Envoyer un e-mail de notification a l agent selon la decision prise (accepte ou refuse) | |
| US-1.6 | Creation compte Expert | T1 | Creer le formulaire de creation d un compte Expert dans l interface administrateur | 1 jour |
| | | T2 | Generer un mot de passe temporaire et envoyer les identifiants d acces par e-mail a l expert | |
| | | T3 | Forcer l expert a definir un nouveau mot de passe des sa premiere connexion | |
| US-1.7 | Securite des acces | T1 | Gerer l authentification par session securisee pour toutes les pages protegees de la plateforme | 1.5 jour |
| | | T2 | Configurer les droits d acces par role : chaque acteur ne voit que son propre espace | |
| | | T3 | Bloquer automatiquement l acces aux pages non autorisees et rediriger vers la connexion | |
| US-1.8 | Profil utilisateur | T1 | Afficher les informations personnelles de l utilisateur connecte (nom, e-mail, ville, role) | 1 jour |
| | | T2 | Permettre la modification du mot de passe apres verification obligatoire de l ancien | |

---

## Sprint 2 — Collecte de Donnees Terrain et Operations SIG

| ID (US) | User Story | ID Tache | Taches detaillees | Duree |
|---------|-----------|----------|-------------------|-------|
| US-2.1 | Portail public citoyen | T1 | Creer la page publique de signalement avec formulaire photo, description et localisation sur carte | 1 jour |
| | | T2 | Permettre l upload de jusqu a 3 photos avec previsualisation avant l envoi | |
| | | T3 | Envoyer le signalement et afficher un message de confirmation a l utilisateur | |
| US-2.2 | Carte interactive | T1 | Afficher une carte geographique interactive de la ville avec les zones decoupees en polygones | 1.5 jour |
| | | T2 | Permettre la navigation sur la carte (zoom, deplacement) et la selection d une zone par clic | |
| | | T3 | Afficher les informations de chaque zone au clic (nom, etat, date de derniere inspection) | |
| US-2.3 | Colorimetrie des zones | T1 | Calculer l etat de chaque zone selon la date de sa derniere inspection terrain | 1 jour |
| | | T2 | Coloriser chaque zone sur la carte selon son etat : vert (recente), orange (a planifier), rouge (urgente) | |
| US-2.4 | Ordre d inspection | T1 | Permettre a l administrateur de creer un ordre en cliquant sur une zone de la carte | 1.5 jour |
| | | T2 | Remplir le formulaire d ordre : selection de l agent, date limite et instructions | |
| | | T3 | Sauvegarder l ordre et afficher la liste des ordres actifs dans l interface administrateur | |
| US-2.5 | Demarrage de patrouille | T1 | Afficher les ordres d inspection en attente dans le tableau de bord de l agent | 1.5 jour |
| | | T2 | Permettre a l agent de demarrer sa patrouille en un clic depuis son tableau de bord ou l e-mail recu | |
| | | T3 | Ouvrir la carte automatiquement centree sur la zone d intervention assignee a l agent | |
| US-2.6 | Signalement terrain | T1 | Permettre a l agent de cliquer sur une voie de la carte pour ouvrir le formulaire de signalement | 1 jour |
| | | T2 | Ajouter une photo et une description, puis soumettre le rapport directement a l expert | |
| | | T3 | Afficher un message de succes et actualiser la carte apres la soumission | |
| US-2.7 | Adressage automatique | T1 | Convertir automatiquement les coordonnees GPS du signalement en adresse postale lisible | 1.5 jour |
| | | T2 | Sauvegarder l adresse textuelle dans le dossier du signalement | |
| | | T3 | Gerer le cas ou l adresse est introuvable en affichant une valeur par defaut | |
| US-2.8 | Affectation a une zone | T1 | Identifier automatiquement la zone geographique correspondant a l emplacement du signalement | 1.5 jour |
| | | T2 | Associer le signalement a cette zone pour qu il apparaisse dans le bon secteur sur la carte | |
| | | T3 | Gerer le cas ou l emplacement GPS ne correspond a aucune zone definie dans le systeme | |
| US-2.9 | Analyse automatique Gemini | T1 | Integrer Gemini pour analyser automatiquement chaque photo soumise par un citoyen | 2.5 jours |
| | | T2 | Determiner si la photo represente une degradation routiere reelle selon un score de confiance | |
| | | T3 | Orienter le signalement vers l expert si valide, ou l ecarter automatiquement dans le cas contraire | |
| | | T4 | Gerer les cas d indisponibilite du service IA en acceptant le signalement par precaution | |
| US-2.10 | Cloture d ordre d inspection | T1 | Ajouter le bouton Terminer la patrouille dans l interface de l agent avec confirmation | 0.5 jour |
| | | T2 | Mettre a jour automatiquement la date de derniere inspection de la zone apres cloture | |

---

## Sprint 3 — Workflow Expert Intelligent et Suivi de Chantier

| ID (US) | User Story | ID Tache | Taches detaillees | Duree |
|---------|-----------|----------|-------------------|-------|
| US-3.1 | Reception des signalements | T1 | Afficher la liste des signalements en attente avec photo miniature, adresse et date de soumission | 1 jour |
| | | T2 | Permettre a l expert de consulter le detail complet d un signalement selectionne | |
| | | T3 | Localiser le signalement sur une mini-carte integree dans la vue de detail | |
| US-3.2 | Detection IA YOLO | T1 | Integrer le modele YOLO pour analyser automatiquement les photos des signalements recus | 2.5 jours |
| | | T2 | Detecter et encadrer visuellement les anomalies sur la photo (fissures, nids-de-poule, affaissements) | |
| | | T3 | Declencher l analyse automatiquement a la reception de chaque nouveau signalement | |
| | | T4 | Enregistrer les resultats de la detection (type, localisation, niveau de confiance) dans le dossier | |
| US-3.3 | Consultation de l analyse IA | T1 | Afficher les resultats de l analyse YOLO dans la fiche : type d anomalie, gravite et score de confiance | 1 jour |
| | | T2 | Superposer visuellement les zones detectees directement sur la photo du signalement | |
| US-3.4 | Validation du signalement | T1 | Afficher le formulaire de validation avec les resultats IA pre-remplis et modifiables par l expert | 1.5 jour |
| | | T2 | Permettre a l expert de corriger le type et la gravite si l analyse IA est inexacte | |
| | | T3 | Valider officiellement le signalement et le retirer de la file d attente | |
| US-3.5 | Affectation de mission | T1 | Afficher la liste des agents disponibles pour l affectation d une mission de reparation | 1.5 jour |
| | | T2 | Permettre a l expert de choisir un agent et de definir le niveau d urgence (normale, haute, urgente) | |
| | | T3 | Envoyer une notification e-mail a l agent assigne avec les details de l intervention | |
| US-3.6 | Suivi de chantier | T1 | Afficher le tableau de suivi des missions en cours avec leur etat et l agent assigne | 1 jour |
| | | T2 | Permettre a l agent de marquer sa mission comme terminee depuis son interface | |
| | | T3 | Mettre a jour automatiquement le statut du chantier dans le tableau de bord expert | |
| US-3.7 | Rapport d inspection PDF | T1 | Generer un rapport structure au format PDF a partir des donnees du dossier | 1 jour |
| | | T2 | Inclure dans le rapport la photo, les resultats d analyse, l adresse et le statut de l intervention | |
| | | T3 | Permettre a l expert de telecharger le rapport directement depuis la fiche du dossier | |
| US-3.8 | Historique de l agent | T1 | Afficher l historique complet des patrouilles terminees de l agent (date, zone, instructions) | 1 jour |
| | | T2 | Permettre de rechercher dans l historique par zone ou par periode | |
| | | T3 | Afficher les signalements soumis lors de chaque patrouille selectionnee dans une fenetre de detail | |

---

## Sprint 4 — Tableaux de Bord Analytiques et Notifications

| ID (US) | User Story | ID Tache | Taches detaillees | Duree |
|---------|-----------|----------|-------------------|-------|
| US-4.1 | Tableau de bord Admin | T1 | Afficher les indicateurs cles : total des signalements, agents actifs et taux de resolution | 1.5 jour |
| | | T2 | Creer des graphiques visuels montrant la repartition des signalements par statut et par source | |
| | | T3 | Mettre en evidence les zones geographiques en etat critique dans le tableau de bord | |
| US-4.2 | Carte de supervision globale | T1 | Afficher tous les signalements actifs sur la carte avec des marqueurs colores selon leur etat | 1.5 jour |
| | | T2 | Permettre de cliquer sur un marqueur pour afficher les details du signalement | |
| US-4.3 | Notifications par e-mail | T1 | Creer les modeles visuels de chaque e-mail automatique (confirmation, approbation, mission) | 1.5 jour |
| | | T2 | Envoyer automatiquement l e-mail approprie a chaque etape cle du circuit de traitement | |
| | | T3 | Verifier la bonne reception des e-mails pour tous les scenarios du workflow | |
| US-4.4 | Maintenance automatique | T1 | Configurer une tache automatique nocturne pour supprimer les signalements rejetes apres 7 jours | 0.5 jour |
| | | T2 | Verifier le bon fonctionnement de la tache et enregistrer un journal des suppressions effectuees | |