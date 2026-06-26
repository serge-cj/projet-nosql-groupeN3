'use client';

import { useState, useMemo } from 'react';
import api from '@/lib/api';

interface OrderItem {
  dishName: string;
  quantity: number;
  unitPrice?: number;
}

interface Deliverer {
  _id: string;
  personalInfo?: {
    firstName?: string;
    lastName?: string;
  };
}

interface RestaurantOrder {
  _id: string;
  customer_id?: { _id?: string; email?: string };
  deliverer_id?: {
    _id: string;
    personalInfo?: {
      firstName?: string;
      lastName?: string;
    };
  } | null;
  status: string;
  pricing?: { total?: number; currency?: string; subtotal?: number; tax?: number; deliveryFee?: number };
  items?: OrderItem[];
  deliveryInfo?: {
    address?: { street?: string; district?: string };
    recipientName?: string;
    phone?: string;
  };
  createdAt?: string;
  metadata?: { createdAt?: string; updatedAt?: string };
}

interface OrderManagerProps {
  orders: RestaurantOrder[];
  onUpdate: () => void;
}

const STATUS_FLOW: Record<string, string> = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'PREPARING',
  PREPARING: 'READY_FOR_DELIVERY',
};

const STATUS_TRANSITIONS: Record<string, { label: string; color: string; actionLabel: string }> = {
  PENDING: { label: 'En attente', color: 'error', actionLabel: 'Confirmer' },
  CONFIRMED: { label: 'Confirmée', color: 'brand', actionLabel: 'Préparer' },
  PREPARING: { label: 'En préparation', color: 'brand', actionLabel: 'Prête pour livraison' },
  READY_FOR_DELIVERY: { label: 'Prête', color: 'brand', actionLabel: '—' },
  DELIVERY_IN_PROGRESS: { label: 'En route', color: 'brand', actionLabel: '—' },
  DELIVERED: { label: 'Livrée', color: 'forest', actionLabel: '—' },
  CANCELLED: { label: 'Annulée', color: 'ink-muted', actionLabel: '—' },
  FAILED: { label: 'Échouée', color: 'error', actionLabel: '—' },
};

export default function OrderManager({ orders, onUpdate }: OrderManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [savingOrderIds, setSavingOrderIds] = useState<Set<string>>(new Set());
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  const [assignmentDelivererId, setAssignmentDelivererId] = useState<string | null>(null);
  const [availableDeliverers, setAvailableDeliverers] = useState<Deliverer[]>([]);
  const [isFetchingDeliverers, setIsFetchingDeliverers] = useState(false);
  const [error, setError] = useState('');

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = !statusFilter || order.status === statusFilter;
      const matchesSearch =
        !searchTerm ||
        order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.deliveryInfo?.recipientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.deliveryInfo?.phone?.includes(searchTerm) ||
        order.customer_id?.email?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, searchTerm]);

  const activeOrders = filteredOrders.filter(
    (o) => !['DELIVERED', 'CANCELLED', 'FAILED'].includes(o.status)
  );
  const completedOrders = filteredOrders.filter(
    (o) => ['DELIVERED', 'CANCELLED', 'FAILED'].includes(o.status)
  );

  const statusCounts = useMemo(() => {
    return {
      all: orders.length,
      active: orders.filter((o) => !['DELIVERED', 'CANCELLED', 'FAILED'].includes(o.status)).length,
      pending: orders.filter((o) => o.status === 'PENDING').length,
    };
  }, [orders]);

  const getDelivererName = (deliverer?: Deliverer | null) => {
    if (!deliverer) return '—';
    const firstName = deliverer.personalInfo?.firstName || '';
    const lastName = deliverer.personalInfo?.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'Livreur';
  };

  async function fetchAvailableDeliverers() {
    setIsFetchingDeliverers(true);
    try {
      const response = await api.get('/deliverers?isAvailable=true');
      const list = response.data.deliverers ?? response.data ?? [];
      setAvailableDeliverers(list);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Impossible de charger les livreurs');
    } finally {
      setIsFetchingDeliverers(false);
    }
  }

  function openAssignPanel(order: RestaurantOrder) {
    if (assigningOrderId === order._id) {
      setAssigningOrderId(null);
      setAssignmentDelivererId(null);
      return;
    }

    setAssigningOrderId(order._id);
    setAssignmentDelivererId(order.deliverer_id?._id ?? null);

    if (availableDeliverers.length === 0) {
      fetchAvailableDeliverers();
    }
  }

  async function handleAssignDeliverer(orderId: string) {
    if (!assignmentDelivererId) {
      setError('Veuillez sélectionner un livreur.');
      return;
    }

    setError('');
    setSavingOrderIds((prev) => new Set([...prev, orderId]));

    try {
      await api.post(`/orders/${orderId}/assign`, {
        delivererId: assignmentDelivererId,
      });
      setAssigningOrderId(null);
      setAssignmentDelivererId(null);
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Impossible d’assigner le livreur');
    } finally {
      setSavingOrderIds((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  }

  async function handleUpdateStatus(orderId: string, newStatus: string) {
    setSavingOrderIds((prev) => new Set([...prev, orderId]));
    setError('');
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erreur lors de la mise à jour du statut');
    } finally {
      setSavingOrderIds((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      error: 'text-error',
      brand: 'text-brand',
      forest: 'text-forest-900',
      'ink-muted': 'text-ink-muted',
    };
    return colors[STATUS_TRANSITIONS[status]?.color] || 'text-ink';
  };

  const getStatusBgColor = (status: string) => {
    const bgColors: Record<string, string> = {
      error: 'bg-error/5 border-error/30',
      brand: 'bg-brand/5 border-brand/30',
      forest: 'bg-forest-100 border-forest-500/30',
      'ink-muted': 'bg-surface-1 border-divider',
    };
    const colorKey = STATUS_TRANSITIONS[status]?.color;
    return bgColors[colorKey] || 'bg-canvas border-divider';
  };

  return (
    <section className="space-y-6">
      {/* Nous affichons ici l'en-tête et les filtres */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold text-ink">Commandes</h2>
          <div className="flex gap-2 text-xs">
            <span className="rounded-pill border border-divider bg-surface-1 px-3 py-1 font-semibold text-ink">
              {statusCounts.active} active{statusCounts.active !== 1 ? 's' : ''}
            </span>
            <span className="rounded-pill border border-error/30 bg-error/5 px-3 py-1 font-semibold text-error">
              {statusCounts.pending} en attente
            </span>
          </div>
        </div>

        {/* Nous proposons ici la barre de recherche et les filtres */}
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            placeholder="Chercher par nom, téléphone ou email…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field text-sm"
          />
          <select
            value={statusFilter ?? ''}
            onChange={(e) => setStatusFilter(e.target.value || null)}
            className="input-field text-sm"
          >
            <option value="">Tous les statuts ({statusCounts.all})</option>
            <option value="PENDING">En attente ({statusCounts.pending})</option>
            <option value="CONFIRMED">Confirmées</option>
            <option value="PREPARING">En préparation</option>
            <option value="READY_FOR_DELIVERY">Prêtes</option>
            <option value="DELIVERED">Livrées</option>
            <option value="CANCELLED">Annulées</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-card border border-error/30 bg-error/5 p-4 text-sm text-error">
          {error}
        </div>
      )}

      {/* Nous listons ici les commandes actives */}
      {activeOrders.length > 0 && (
        <div>
          <h3 className="mb-4 font-semibold text-ink">Commandes en cours ({activeOrders.length})</h3>
          <div className="space-y-3">
            {activeOrders.map((order) => {
              const isExpanded = expandedOrderId === order._id;
              const isSaving = savingOrderIds.has(order._id);
              const trans = STATUS_TRANSITIONS[order.status];
              const timestamp = order.createdAt || order.metadata?.createdAt;
              const date = timestamp ? new Date(timestamp).toLocaleString('fr-FR') : '—';

              return (
                <div
                  key={order._id}
                  className="surface-card rounded-card border border-divider p-4 transition-all"
                >
                  {/* Nous affichons ici l'en-tête de la commande */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-ink">#{order._id.slice(-6).toUpperCase()}</p>
                          <span className={`rounded-pill border ${getStatusBgColor(order.status)} px-2 py-0.5 text-xs font-semibold ${getStatusColor(order.status)}`}>
                            {trans?.label}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-medium text-ink">
                          {order.deliveryInfo?.recipientName || 'Client'}
                        </p>
                        <p className="text-xs text-ink-muted">{date}</p>
                        <p className="mt-2 text-sm text-ink-muted">
                          Livreur : <span className="font-medium text-ink">{getDelivererName(order.deliverer_id)}</span>
                        </p>
                        <button
                          type="button"
                          onClick={() => openAssignPanel(order)}
                          className="btn-outline mt-3 text-xs"
                        >
                          {order.deliverer_id ? 'Modifier' : 'Assigner'}
                        </button>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-semibold tabular-nums text-ink">
                          {order.pricing?.total?.toLocaleString()} {order.pricing?.currency || 'FCFA'}
                        </p>
                        {STATUS_FLOW[order.status] && (
                          <button
                            onClick={() => handleUpdateStatus(order._id, STATUS_FLOW[order.status])}
                            className="btn-primary mt-2 text-xs"
                            disabled={isSaving}
                          >
                            {isSaving ? '⏳' : trans?.actionLabel}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Nous présentons ici un aperçu des articles */}
                    {order.items && order.items.length > 0 && (
                      <div className="border-t border-divider pt-3">
                        <div className="space-y-1">
                          {order.items.slice(0, 2).map((item, i) => (
                            <p key={i} className="text-sm text-ink-muted">
                              {item.quantity}× {item.dishName}
                            </p>
                          ))}
                          {order.items.length > 2 && (
                            <p className="text-xs text-ink-muted/60">+{order.items.length - 2} autres</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Nous gérons ici l'assignation d'un livreur */}
                    {assigningOrderId === order._id && (
                      <div className="mt-4 rounded-card border border-divider bg-surface-2 p-4">
                        <label className="text-sm font-semibold text-ink">Sélectionner un livreur</label>
                        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                          <select
                            value={assignmentDelivererId ?? ''}
                            onChange={(e) => setAssignmentDelivererId(e.target.value || null)}
                            className="input-field flex-1 text-sm"
                            disabled={isFetchingDeliverers}
                          >
                            <option value="">Choisir un livreur</option>
                            {availableDeliverers.map((deliverer) => (
                              <option key={deliverer._id} value={deliverer._id}>
                                {getDelivererName(deliverer)}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => handleAssignDeliverer(order._id)}
                            className="btn-primary min-w-[120px] text-xs"
                            disabled={savingOrderIds.has(order._id) || isFetchingDeliverers}
                          >
                            {savingOrderIds.has(order._id) ? '⏳ En cours' : 'Confirmer'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAssigningOrderId(null);
                              setAssignmentDelivererId(null);
                            }}
                            className="btn-secondary min-w-[120px] text-xs"
                          >
                            Annuler
                          </button>
                        </div>
                        {isFetchingDeliverers && (
                          <p className="mt-2 text-xs text-ink-muted">Chargement des livreurs...</p>
                        )}
                      </div>
                    )}

                    {/* Nous proposons ici le bouton permettant de développer les détails */}
                    <button
                      type="button"
                      onClick={() => setExpandedOrderId(isExpanded ? null : order._id)}
                      className="text-xs font-semibold text-brand hover:underline"
                    >
                      {isExpanded ? '▼ Masquer détails' : '▶ Voir détails'}
                    </button>
                  </div>

                  {/* Nous affichons ici les détails développables */}
                  {isExpanded && (
                    <div className="mt-4 space-y-4 border-t border-divider pt-4">
                      {/* Nous affichons ici les informations de livraison */}
                      <div>
                        <h4 className="mb-2 text-xs font-semibold uppercase text-ink-muted">Livraison</h4>
                        <div className="space-y-1 text-sm text-ink">
                          <p>{order.deliveryInfo?.address?.street}</p>
                          <p className="text-ink-muted">{order.deliveryInfo?.address?.district}</p>
                          {order.deliveryInfo?.phone && (
                            <p className="text-ink-muted">{order.deliveryInfo.phone}</p>
                          )}
                        </div>
                      </div>

                      {/* Nous affichons ici la liste complète des articles */}
                      <div>
                        <h4 className="mb-2 text-xs font-semibold uppercase text-ink-muted">Articles ({order.items?.length})</h4>
                        <div className="space-y-2">
                          {order.items?.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span className="text-ink">{item.quantity}× {item.dishName}</span>
                              <span className="text-ink-muted tabular-nums">
                                {((item.unitPrice || 0) * item.quantity).toLocaleString()} FCFA
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Nous détaillons ici le prix de la commande */}
                      <div className="space-y-1 border-t border-divider pt-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-ink-muted">Sous-total</span>
                          <span className="text-ink">{order.pricing?.subtotal?.toLocaleString()} FCFA</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-ink-muted">Livraison</span>
                          <span className="text-ink">{order.pricing?.deliveryFee?.toLocaleString()} FCFA</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-ink-muted">Taxes</span>
                          <span className="text-ink">{order.pricing?.tax?.toLocaleString()} FCFA</span>
                        </div>
                        <div className="flex justify-between border-t border-divider pt-2 font-semibold">
                          <span className="text-ink">Total</span>
                          <span className="text-brand">{order.pricing?.total?.toLocaleString()} FCFA</span>
                        </div>
                      </div>

                      {/* Nous affichons ici les informations relatives au livreur */}
                      <div>
                        <h4 className="mb-2 text-xs font-semibold uppercase text-ink-muted">Livreur</h4>
                        <p className="text-sm text-ink">{getDelivererName(order.deliverer_id)}</p>
                        <button
                          type="button"
                          onClick={() => openAssignPanel(order)}
                          className="btn-outline mt-3 text-xs"
                        >
                          {order.deliverer_id ? 'Modifier le livreur' : 'Assigner un livreur'}
                        </button>
                      </div>
                      <div>
                        <h4 className="mb-2 text-xs font-semibold uppercase text-ink-muted">Client</h4>
                        <p className="text-sm text-ink">{order.customer_id?.email || '—'}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Nous listons ici les commandes terminées */}
      {completedOrders.length > 0 && (
        <div>
          <h3 className="mb-4 font-semibold text-ink-muted">Commandes terminées ({completedOrders.length})</h3>
          <div className="space-y-2">
            {completedOrders.slice(0, 10).map((order) => {
              const trans = STATUS_TRANSITIONS[order.status];
              const timestamp = order.createdAt || order.metadata?.createdAt;
              const date = timestamp ? new Date(timestamp).toLocaleDateString('fr-FR') : '—';

              return (
                <div key={order._id} className="rounded-card border border-divider bg-surface-1 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink">#{order._id.slice(-6).toUpperCase()}</p>
                      <p className="text-xs text-ink-muted">{date}</p>
                    </div>
                    <span className={`rounded-pill border ${getStatusBgColor(order.status)} px-2 py-0.5 text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {trans?.label}
                    </span>
                    <span className="ml-3 tabular-nums text-ink-muted">
                      {order.pricing?.total?.toLocaleString()} FCFA
                    </span>
                  </div>
                </div>
              );
            })}
            {completedOrders.length > 10 && (
              <p className="text-center text-xs text-ink-muted">
                +{completedOrders.length - 10} commandes terminées supplémentaires
              </p>
            )}
          </div>
        </div>
      )}

      {/* Nous affichons ici un message lorsqu'aucune commande n'est trouvée */}
      {filteredOrders.length === 0 && (
        <div className="surface-card rounded-card border border-divider p-12 text-center">
          <p className="font-semibold text-ink">Aucune commande trouvée</p>
          <p className="mt-1 text-sm text-ink-muted">
            {searchTerm || statusFilter
              ? 'Essayez d\'affiner votre recherche'
              : 'Les commandes de vos clients apparaîtront ici'}
          </p>
        </div>
      )}
    </section>
  );
}
