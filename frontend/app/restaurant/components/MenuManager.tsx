'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { formatAmount } from '@/lib/format';

interface Dish {
  _id?: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  category?: string;
  isAvailable?: boolean;
  quantity?: number;
  preparationTime?: number;
  image?: string;
}

interface Menu {
  _id?: string;
  name: string;
  description?: string;
  dishes: Dish[];
}

interface MenuManagerProps {
  restaurantId: string;
  menus: Menu[];
  onUpdate: () => void;
}

type DishFormMode = 'create' | 'edit';

export default function MenuManager({ restaurantId, menus, onUpdate }: MenuManagerProps) {
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [newMenuName, setNewMenuName] = useState('');
  const [newMenuDescription, setNewMenuDescription] = useState('');
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
  const [editMenuName, setEditMenuName] = useState('');
  const [editMenuDescription, setEditMenuDescription] = useState('');
  const [dishFormMode, setDishFormMode] = useState<DishFormMode>('create');
  const [activeDishMenuId, setActiveDishMenuId] = useState<string | null>(null);
  const [editDishId, setEditDishId] = useState<string | null>(null);
  const [dishName, setDishName] = useState('');
  const [dishDescription, setDishDescription] = useState('');
  const [dishPrice, setDishPrice] = useState('');
  const [dishCategory, setDishCategory] = useState('Plats Principaux');
  const [dishIsAvailable, setDishIsAvailable] = useState(true);
  const [dishQuantity, setDishQuantity] = useState('0');
  const [dishPreparationTime, setDishPreparationTime] = useState('15');
  const [error, setError] = useState('');
  const [isSavingMenu, setIsSavingMenu] = useState(false);
  const [savingMenuIds, setSavingMenuIds] = useState<Set<string>>(new Set());
  const [savingDishIds, setSavingDishIds] = useState<Set<string>>(new Set());

  function resetDishForm() {
    setDishFormMode('create');
    setActiveDishMenuId(null);
    setEditDishId(null);
    setDishName('');
    setDishDescription('');
    setDishPrice('');
    setDishCategory('Plats Principaux');
    setDishIsAvailable(true);
    setDishQuantity('0');
    setDishPreparationTime('15');
  }

  async function handleCreateMenu(e: React.FormEvent) {
    e.preventDefault();
    if (!newMenuName.trim()) {
      setError('Le nom du menu est obligatoire');
      return;
    }

    setIsSavingMenu(true);
    setError('');
    try {
      await api.post(`/restaurants/${restaurantId}/menus`, {
        name: newMenuName,
        description: newMenuDescription,
        dishes: [],
      });
      setNewMenuName('');
      setNewMenuDescription('');
      setShowCreateMenu(false);
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erreur lors de la création du menu');
    } finally {
      setIsSavingMenu(false);
    }
  }

  async function handleUpdateMenu(menuId: string, e: React.FormEvent) {
    e.preventDefault();
    if (!editMenuName.trim()) {
      setError('Le nom du menu est obligatoire');
      return;
    }

    setSavingMenuIds((prev) => new Set([...prev, menuId]));
    setError('');
    try {
      await api.patch(`/restaurants/${restaurantId}/menus/${menuId}`, {
        name: editMenuName,
        description: editMenuDescription,
      });
      setEditingMenuId(null);
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erreur lors de la mise à jour du menu');
    } finally {
      setSavingMenuIds((prev) => {
        const next = new Set(prev);
        next.delete(menuId);
        return next;
      });
    }
  }

  function openEditMenu(menu: Menu) {
    setEditingMenuId(menu._id ?? null);
    setEditMenuName(menu.name);
    setEditMenuDescription(menu.description ?? '');
    setError('');
  }

  function openDishForm(menuId: string, mode: DishFormMode, dish?: Dish) {
    setDishFormMode(mode);
    setActiveDishMenuId(menuId);
    setError('');

    if (mode === 'edit' && dish) {
      setEditDishId(dish._id ?? null);
      setDishName(dish.name);
      setDishDescription(dish.description ?? '');
      setDishPrice(String(dish.price));
      setDishCategory(dish.category ?? 'Plats Principaux');
      setDishIsAvailable(dish.isAvailable ?? true);
      setDishQuantity(String(dish.quantity ?? 0));
      setDishPreparationTime(String(dish.preparationTime ?? 15));
    } else {
      resetDishForm();
      setActiveDishMenuId(menuId);
    }
  }

  async function handleSubmitDish(menuId: string, e: React.FormEvent) {
    e.preventDefault();
    if (!dishName.trim() || !dishPrice) {
      setError('Le nom et le prix du plat sont obligatoires');
      return;
    }

    const dishKey = `${menuId}-${editDishId || 'new'}`;
    setSavingDishIds((prev) => new Set([...prev, dishKey]));
    setError('');

    const parsedPrice = parseFloat(dishPrice);
    const parsedPreparationTime = Number(dishPreparationTime) || 15;
    const parsedQuantity = Math.max(0, Number(dishQuantity) || 0);
    const payload = {
      name: dishName,
      description: dishDescription || undefined,
      price: parsedPrice,
      category: dishCategory,
      isAvailable: dishIsAvailable,
      quantity: parsedQuantity,
      preparationTime: parsedPreparationTime,
    };

    try {
      if (dishFormMode === 'create') {
        await api.post(`/restaurants/${restaurantId}/menus/${menuId}/dishes`, payload);
      } else if (dishFormMode === 'edit' && editDishId) {
        await api.patch(`/restaurants/${restaurantId}/menus/${menuId}/dishes/${editDishId}`, payload);
      }
      resetDishForm();
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erreur lors de l\'enregistrement du plat');
    } finally {
      setSavingDishIds((prev) => {
        const next = new Set(prev);
        next.delete(dishKey);
        return next;
      });
    }
  }

  async function handleDeleteDish(menuId: string, dishId: string) {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce plat ?')) return;

    const dishKey = `${menuId}-${dishId}`;
    setSavingDishIds((prev) => new Set([...prev, dishKey]));
    setError('');
    try {
      await api.delete(`/restaurants/${restaurantId}/menus/${menuId}/dishes/${dishId}`);
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erreur lors de la suppression du plat');
    } finally {
      setSavingDishIds((prev) => {
        const next = new Set(prev);
        next.delete(dishKey);
        return next;
      });
    }
  }

  async function handleDeleteMenu(menuId: string) {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce menu ?')) return;

    setSavingMenuIds((prev) => new Set([...prev, menuId]));
    setError('');
    try {
      await api.delete(`/restaurants/${restaurantId}/menus/${menuId}`);
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erreur lors de la suppression du menu');
    } finally {
      setSavingMenuIds((prev) => {
        const next = new Set(prev);
        next.delete(menuId);
        return next;
      });
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold text-ink">Menus & Plats</h2>
        <button
          type="button"
          onClick={() => {
            setShowCreateMenu((current) => !current);
            setError('');
          }}
          className="btn-primary text-sm"
          disabled={isSavingMenu}
        >
          {isSavingMenu ? '⏳ Création…' : showCreateMenu ? 'Annuler' : '+ Nouveau menu'}
        </button>
      </div>

      {error && (
        <div className="rounded-card border border-error/30 bg-error/5 p-4 text-sm text-error">
          {error}
        </div>
      )}

      {showCreateMenu && (
        <div className="surface-card space-y-4 p-6">
          <h3 className="font-semibold text-ink">Créer un nouveau menu</h3>
          <form onSubmit={handleCreateMenu} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-ink">Nom du menu</span>
              <input
                type="text"
                value={newMenuName}
                onChange={(e) => setNewMenuName(e.target.value)}
                className="input-field"
                placeholder="ex: Petit-déjeuner"
                required
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-ink">Description (optionnel)</span>
              <textarea
                value={newMenuDescription}
                onChange={(e) => setNewMenuDescription(e.target.value)}
                className="input-field"
                placeholder="Description du menu"
                rows={2}
              />
            </label>
            <button type="submit" className="btn-primary w-full text-sm" disabled={isSavingMenu}>
              {isSavingMenu ? '⏳ Création…' : 'Créer le menu'}
            </button>
          </form>
        </div>
      )}

      {menus.length === 0 ? (
        <div className="surface-card rounded-card border border-divider p-8 text-center">
          <p className="text-ink-muted">Aucun menu. Créez votre premier menu pour commencer.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {menus.map((menu) => {
            const isEditingMenu = editingMenuId === menu._id;
            const isDishFormOpen = activeDishMenuId === menu._id;

            return (
              <div key={menu._id} className="surface-card space-y-4 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-ink">{menu.name}</h3>
                    {menu.description && (
                      <p className="mt-1 text-sm text-ink-muted">{menu.description}</p>
                    )}
                    <p className="mt-2 text-xs text-ink-muted">
                      {menu.dishes.length} plat{menu.dishes.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => openEditMenu(menu)}
                      className="rounded-pill border border-divider bg-surface-2 px-3 py-1 text-xs font-semibold text-ink hover:bg-surface-3 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={savingMenuIds.has(menu._id || '')}
                    >
                      {savingMenuIds.has(menu._id || '') ? '⏳ Sauvegarde…' : 'Modifier le menu'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMenu(menu._id || '')}
                      className="rounded-pill border border-error/30 bg-error/5 px-3 py-1 text-xs font-semibold text-error hover:bg-error/10 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={savingMenuIds.has(menu._id || '')}
                    >
                      {savingMenuIds.has(menu._id || '') ? '⏳ Suppression…' : 'Supprimer'}
                    </button>
                  </div>
                </div>

                {isEditingMenu ? (
                  <form onSubmit={(e) => handleUpdateMenu(menu._id || '', e)} className="space-y-4 rounded-card border border-divider bg-surface-2 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block space-y-1">
                        <span className="text-xs font-semibold text-ink">Nom du menu</span>
                        <input
                          type="text"
                          value={editMenuName}
                          onChange={(e) => setEditMenuName(e.target.value)}
                          className="input-field text-sm"
                          required
                        />
                      </label>
                      <label className="block space-y-1 sm:col-span-2">
                        <span className="text-xs font-semibold text-ink">Description</span>
                        <textarea
                          value={editMenuDescription}
                          onChange={(e) => setEditMenuDescription(e.target.value)}
                          className="input-field text-sm"
                          rows={2}
                        />
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="btn-primary flex-1 text-sm" disabled={savingMenuIds.has(menu._id || '')}>
                        {savingMenuIds.has(menu._id || '') ? '⏳ Enregistrement…' : 'Enregistrer'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingMenuId(null)}
                        className="btn-secondary flex-1 text-sm"
                        disabled={savingMenuIds.has(menu._id || '')}
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                ) : null}

                <div className="border-t border-divider pt-4">
                  {menu.dishes.length > 0 ? (
                    <div className="space-y-3">
                      {menu.dishes.map((dish) => (
                        <div key={dish._id} className="rounded-card border border-divider bg-canvas p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <p className="font-medium text-ink">{dish.name}</p>
                              {dish.description && (
                                <p className="text-xs text-ink-muted">{dish.description}</p>
                              )}
                              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                <span className="font-semibold text-brand tabular-nums">
                                  {formatAmount(dish.price)} FCFA
                                </span>
                                <span className="text-ink-muted">{dish.category}</span>
                                <span className={`font-semibold ${dish.isAvailable ? 'text-forest-600' : 'text-error'}`}>
                                  {dish.isAvailable ? 'Disponible' : 'Indisponible'}
                                </span>
                                <span className="text-ink-muted">Stock : {dish.quantity ?? 0}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => openDishForm(menu._id || '', 'edit', dish)}
                                className="rounded-pill border border-divider bg-surface-2 px-3 py-1 text-xs font-semibold text-ink hover:bg-surface-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={savingDishIds.has(`${menu._id}-${dish._id}`)}
                              >
                                {savingDishIds.has(`${menu._id}-${dish._id}`) ? '⏳' : 'Modifier'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteDish(menu._id || '', dish._id || '')}
                                className="rounded-pill border border-error/30 bg-error/5 px-3 py-1 text-xs font-semibold text-error hover:bg-error/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={savingDishIds.has(`${menu._id}-${dish._id}`)}
                              >
                                {savingDishIds.has(`${menu._id}-${dish._id}`) ? '⏳' : 'Supprimer'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-ink-muted">Aucun plat dans ce menu.</p>
                  )}
                </div>

                <div className="rounded-card border border-divider bg-surface-2 p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h4 className="text-sm font-semibold text-ink">{dishFormMode === 'edit' ? 'Modifier le plat' : 'Ajouter un plat'}</h4>
                    {!isDishFormOpen && (
                      <button
                        type="button"
                        onClick={() => openDishForm(menu._id || '', 'create')}
                        className="btn-secondary text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={savingMenuIds.has(menu._id || '')}
                      >
                        + Ajouter un plat
                      </button>
                    )}
                  </div>
                  {activeDishMenuId === menu._id ? (
                    <form onSubmit={(e) => handleSubmitDish(menu._id || '', e)} className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block space-y-1">
                          <span className="text-xs font-semibold text-ink">Nom du plat</span>
                          <input
                            type="text"
                            value={dishName}
                            onChange={(e) => setDishName(e.target.value)}
                            className="input-field text-sm"
                            placeholder="Riz à l'eau"
                            required
                            disabled={savingDishIds.has(`${menu._id}-${editDishId || 'new'}`)}
                          />
                        </label>
                        <label className="block space-y-1">
                          <span className="text-xs font-semibold text-ink">Prix (FCFA)</span>
                          <input
                            type="number"
                            value={dishPrice}
                            onChange={(e) => setDishPrice(e.target.value)}
                            className="input-field text-sm"
                            placeholder="2500"
                            required
                            disabled={savingDishIds.has(`${menu._id}-${editDishId || 'new'}`)}
                          />
                        </label>
                        <label className="block space-y-1">
                          <span className="text-xs font-semibold text-ink">Préparation (min)</span>
                          <input
                            type="number"
                            value={dishPreparationTime}
                            onChange={(e) => setDishPreparationTime(e.target.value)}
                            className="input-field text-sm"
                            min={5}
                            disabled={savingDishIds.has(`${menu._id}-${editDishId || 'new'}`)}
                          />
                        </label>
                        <label className="block space-y-1">
                          <span className="text-xs font-semibold text-ink">Statut</span>
                          <select
                            value={String(dishIsAvailable)}
                            onChange={(e) => setDishIsAvailable(e.target.value === 'true')}
                            className="input-field text-sm"
                            disabled={savingDishIds.has(`${menu._id}-${editDishId || 'new'}`)}
                          >
                            <option value="true">Disponible</option>
                            <option value="false">Indisponible</option>
                          </select>
                        </label>
                        <label className="block space-y-1">
                          <span className="text-xs font-semibold text-ink">Stock disponible</span>
                          <input
                            type="number"
                            value={dishQuantity}
                            onChange={(e) => setDishQuantity(e.target.value)}
                            className="input-field text-sm"
                            placeholder="0"
                            min={0}
                            disabled={savingDishIds.has(`${menu._id}-${editDishId || 'new'}`)}
                          />
                        </label>
                        <label className="block space-y-1 sm:col-span-2">
                          <span className="text-xs font-semibold text-ink">Catégorie</span>
                          <select
                            value={dishCategory}
                            onChange={(e) => setDishCategory(e.target.value)}
                            className="input-field text-sm"
                            disabled={savingDishIds.has(`${menu._id}-${editDishId || 'new'}`)}
                          >
                            <option>Plats Principaux</option>
                            <option>Accompagnements</option>
                            <option>Desserts</option>
                            <option>Boissons</option>
                            <option>Entrées</option>
                          </select>
                        </label>
                        <label className="block space-y-1 sm:col-span-2">
                          <span className="text-xs font-semibold text-ink">Description (optionnel)</span>
                          <textarea
                            value={dishDescription}
                            onChange={(e) => setDishDescription(e.target.value)}
                            className="input-field text-sm"
                            rows={2}
                            placeholder="Ex: Riz parfumé au gingembre"
                            disabled={savingDishIds.has(`${menu._id}-${editDishId || 'new'}`)}
                          />
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          type="submit" 
                          className="btn-primary flex-1 text-sm" 
                          disabled={savingDishIds.has(`${menu._id}-${editDishId || 'new'}`)}
                        >
                          {savingDishIds.has(`${menu._id}-${editDishId || 'new'}`) 
                            ? '⏳ Enregistrement…' 
                            : dishFormMode === 'edit' ? 'Mettre à jour' : 'Ajouter'}
                        </button>
                        <button
                          type="button"
                          onClick={resetDishForm}
                          className="btn-secondary flex-1 text-sm"
                          disabled={savingDishIds.has(`${menu._id}-${editDishId || 'new'}`)}
                        >
                          Annuler
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className="text-sm text-ink-muted">Cliquez sur &quot;+ Ajouter un plat&quot; pour commencer.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
