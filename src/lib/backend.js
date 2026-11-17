/* Point d'entrée unique vers les données.
   Si VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont définis (fichier .env), tout passe par Supabase ;
   sinon, le site fonctionne en mode démo avec le stockage du navigateur.
   Les deux exposent les mêmes fonctions : listProducts, saveProduct, deleteProduct, listPromos, savePromo,
   deletePromo, checkPromo, listOrders, createOrder, updateOrderStatus, getSession, signIn, signOut,
   adminExists, createFirstAdmin, listUsers, createUser, updateUser, deleteUser. */
import * as local from './local.js';
import * as supabase from './supabase.js';

export const backend = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY ? supabase : local;
