# Guide d'utilisation Socket.io - Libreville Eats

## Configuration

Le serveur Socket.io est disponible sur le même port que l'API (par défaut 5000).

## Installation Client

```bash
npm install socket.io-client
```

## Connexion au Serveur

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: 'votre_jwt_token',
    userId: 'votre_user_id',
  },
});
```

## Événements Disponibles

### Rejoindre une Room de Commande

Pour suivre une commande en temps réel, rejoignez la room de la commande :

```javascript
socket.emit('join:order', orderId);
```

### Quitter une Room de Commande

```javascript
socket.emit('leave:order', orderId);
```

### Écouter les Mises à Jour de Position GPS

Le livreur envoie sa position GPS, les clients de la room reçoivent :

```javascript
socket.on('location:updated', (data) => {
  console.log('Position GPS mise à jour:', data);
  // {
  //   orderId: '...',
  //   lat: 0.39,
  //   lng: 9.45,
  //   timestamp: '2026-06-14T...'
  // }
});
```

### Écouter les Mises à Jour de Statut de Commande

```javascript
socket.on('order:status:updated', (data) => {
  console.log('Statut commande mis à jour:', data);
  // {
  //   orderId: '...',
  //   status: 'CONFIRMED',
  //   note: 'Commande confirmée',
  //   timestamp: '2026-06-14T...'
  // }
});
```

### Écouter l'Assignation de Livreur

```javascript
socket.on('order:deliverer:assigned', (data) => {
  console.log('Livreur assigné:', data);
  // {
  //   orderId: '...',
  //   delivererId: '...',
  //   delivererName: 'Jean',
  //   timestamp: '2026-06-14T...'
  // }
});
```

## Exemple d'Intégration Complète

```javascript
import { io } from 'socket.io-client';

class OrderTracking {
  constructor(jwtToken, userId) {
    this.socket = io('http://localhost:5000', {
      auth: { token: jwtToken, userId },
    });

    this.setupListeners();
  }

  setupListeners() {
    // Écouter les mises à jour de position GPS
    this.socket.on('location:updated', (data) => {
      this.onLocationUpdated(data);
    });

    // Écouter les mises à jour de statut
    this.socket.on('order:status:updated', (data) => {
      this.onStatusUpdated(data);
    });

    // Écouter l'assignation de livreur
    this.socket.on('order:deliverer:assigned', (data) => {
      this.onDelivererAssigned(data);
    });
  }

  trackOrder(orderId) {
    this.socket.emit('join:order', orderId);
  }

  stopTracking(orderId) {
    this.socket.emit('leave:order', orderId);
  }

  onLocationUpdated(data) {
    console.log('Position livreur:', data.lat, data.lng);
    // Mettre à jour la carte avec la nouvelle position
  }

  onStatusUpdated(data) {
    console.log('Statut commande:', data.status);
    // Mettre à jour l'interface avec le nouveau statut
  }

  onDelivererAssigned(data) {
    console.log('Livreur assigné:', data.delivererName);
    // Afficher les informations du livreur
  }

  disconnect() {
    this.socket.disconnect();
  }
}

// Utilisation
const tracking = new OrderTracking('jwt_token', 'user_id');
tracking.trackOrder('order_id');
```

## Sécurité

- Le middleware d'authentification Socket.io valide le token JWT
- Les rooms sont basées sur les IDs de commande
- Les événements sont émis uniquement aux clients autorisés (dans la room)

## Scaling Horizontal

Le serveur utilise l'adapter Redis pour le scaling horizontal. Si vous avez plusieurs instances du serveur, les événements seront correctement diffusés à tous les clients connectés via Redis.

## Développement

Pour le développement local, assurez-vous que Redis est en cours d'exécution pour que l'adapter fonctionne correctement.
