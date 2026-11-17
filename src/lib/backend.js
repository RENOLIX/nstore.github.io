/* Point d'entrée unique vers les données.
   Aujourd'hui : stockage local du navigateur.
   Branchement Supabase : écrire src/lib/supabase.js avec les mêmes fonctions
   (listProducts, saveProduct, deleteProduct, listPromos, savePromo, deletePromo,
   listOrders, createOrder, updateOrderStatus, getSession, signIn, signOut),
   puis le choisir ici quand VITE_SUPABASE_URL est défini. */
import * as local from './local.js';

export const backend = local;
