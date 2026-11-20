# Application de suivi — Fluoxétine

Application mobile simple pour enregistrer chaque jour : date, heure de prise, anxiété, tristesse/pleurs, dévalorisation, concentration/mémoire, sommeil et effets physiques.

## Utilisation locale

```powershell
py -m http.server 8080
```

Puis ouvrir `http://localhost:8080` depuis l’ordinateur. Pour utiliser depuis un téléphone sur le même réseau Wi-Fi : trouver l’adresse IP de l’ordinateur avec `ipconfig`, puis ouvrir `http://ADRESSE_IP:8080` sur le téléphone.

Les données restent dans le stockage local du navigateur. Le bouton « ⇩ » exporte un fichier CSV.

> Cette application est un outil de suivi personnel, pas un dispositif médical ni un remplacement d’un avis professionnel.
