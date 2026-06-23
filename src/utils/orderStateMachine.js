// Machine à états des statuts de commande
const ORDER_STATUSES = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PREPARING: 'PREPARING',
  READY_FOR_DELIVERY: 'READY_FOR_DELIVERY',
  DELIVERY_IN_PROGRESS: 'DELIVERY_IN_PROGRESS',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED',
};

// Transitions valides entre les statuts
const VALID_TRANSITIONS = {
  [ORDER_STATUSES.PENDING]: [
    ORDER_STATUSES.CONFIRMED,
    ORDER_STATUSES.CANCELLED,
    ORDER_STATUSES.FAILED,
  ],
  [ORDER_STATUSES.CONFIRMED]: [
    ORDER_STATUSES.PREPARING,
    ORDER_STATUSES.CANCELLED,
    ORDER_STATUSES.FAILED,
  ],
  [ORDER_STATUSES.PREPARING]: [
    ORDER_STATUSES.READY_FOR_DELIVERY,
    ORDER_STATUSES.CANCELLED,
    ORDER_STATUSES.FAILED,
  ],
  [ORDER_STATUSES.READY_FOR_DELIVERY]: [
    ORDER_STATUSES.DELIVERY_IN_PROGRESS,
    ORDER_STATUSES.CANCELLED,
  ],
  [ORDER_STATUSES.DELIVERY_IN_PROGRESS]: [
    ORDER_STATUSES.DELIVERED,
    ORDER_STATUSES.FAILED,
  ],
  [ORDER_STATUSES.DELIVERED]: [], // État final
  [ORDER_STATUSES.CANCELLED]: [], // État final
  [ORDER_STATUSES.FAILED]: [], // État final
};

/**
 * Valide si une transition de statut est autorisée
 * @param {string} currentStatus - Statut actuel de la commande
 * @param {string} newStatus - Nouveau statut demandé
 * @returns {boolean} - true si la transition est valide
 */
function isValidTransition(currentStatus, newStatus) {
  if (!VALID_TRANSITIONS[currentStatus]) {
    return false;
  }
  return VALID_TRANSITIONS[currentStatus].includes(newStatus);
}

/**
 * Valide si un statut existe
 * @param {string} status - Statut à valider
 * @returns {boolean} - true si le statut existe
 */
function isValidStatus(status) {
  return Object.values(ORDER_STATUSES).includes(status);
}

/**
 * Retourne les statuts possibles depuis un statut donné
 * @param {string} currentStatus - Statut actuel
 * @returns {string[]} - Liste des statuts possibles
 */
function getNextPossibleStatuses(currentStatus) {
  return VALID_TRANSITIONS[currentStatus] || [];
}

module.exports = {
  ORDER_STATUSES,
  isValidTransition,
  isValidStatus,
  getNextPossibleStatuses,
};
