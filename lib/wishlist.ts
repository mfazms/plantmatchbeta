// ================================================
// ðŸ"˜ lib/wishlist.ts
// ================================================

import { db, auth } from "./firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc, // ✅ hapus updateDoc karena tidak dipakai
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import type { Plant } from "./types";

// ✅ UBAH plantId jadi number
export type WishlistItem = {
  id: string;
  plantId: number;  // ✅ Sesuaikan dengan Plant.id yang number
  userId: string;
  plantData: Plant;
  addedAt: Date;
};

export async function addToWishlist(plant: Plant): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) {
    alert("Silakan login terlebih dahulu");
    return false;
  }

  try {
    const wishlistRef = doc(db, "wishlist", `${user.uid}_${plant.id}`);

    const existingDoc = await getDoc(wishlistRef);
    if (existingDoc.exists()) {
      alert("Tanaman sudah ada di wishlist!");
      return false;
    }

    const wishlistData: Omit<WishlistItem, "id"> = {
      plantId: plant.id,  // ✅ Langsung pakai plant.id (number)
      userId: user.uid,
      plantData: plant,
      addedAt: new Date(),
    };

    await setDoc(wishlistRef, {
      ...wishlistData,
      addedAt: Timestamp.fromDate(wishlistData.addedAt),
    });

    return true;
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    alert("Gagal menambahkan ke wishlist");
    return false;
  }
}

export async function removeFromWishlist(plantId: number): Promise<boolean> {  // ✅ Ubah ke number
  const user = auth.currentUser;
  if (!user) return false;

  try {
    const wishlistRef = doc(db, "wishlist", `${user.uid}_${plantId}`);
    await deleteDoc(wishlistRef);
    return true;
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    alert("Gagal menghapus dari wishlist");
    return false;
  }
}

export async function getWishlist(): Promise<WishlistItem[]> {
  const user = auth.currentUser;
  if (!user) return [];

  try {
    const wishlistQuery = query(
      collection(db, "wishlist"),
      where("userId", "==", user.uid)
    );

    const snapshot = await getDocs(wishlistQuery);
    const items: WishlistItem[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      items.push({
        id: doc.id,
        plantId: data.plantId,
        userId: data.userId,
        plantData: data.plantData,
        addedAt: data.addedAt?.toDate() || new Date(),
      });
    });

    return items.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return [];
  }
}

export async function isInWishlist(plantId: number): Promise<boolean> {  // ✅ Ubah ke number
  const user = auth.currentUser;
  if (!user) return false;

  try {
    const wishlistRef = doc(db, "wishlist", `${user.uid}_${plantId}`);
    const docSnap = await getDoc(wishlistRef);
    return docSnap.exists();
  } catch (error) {
    console.error("Error checking wishlist:", error);
    return false;
  }
}

export async function getWishlistCount(): Promise<number> {
  const user = auth.currentUser;
  if (!user) return 0;

  try {
    const wishlistQuery = query(
      collection(db, "wishlist"),
      where("userId", "==", user.uid)
    );

    const snapshot = await getDocs(wishlistQuery);
    return snapshot.size;
  } catch (error) {
    console.error("Error getting wishlist count:", error);
    return 0;
  }
}

export async function removeMultipleFromWishlist(
  plantIds: number[]  // ✅ Ubah ke number[]
): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;

  try {
    const deletePromises = plantIds.map((plantId) => {
      const wishlistRef = doc(db, "wishlist", `${user.uid}_${plantId}`);
      return deleteDoc(wishlistRef);
    });

    await Promise.all(deletePromises);
    return true;
  } catch (error) {
    console.error("Error removing multiple from wishlist:", error);
    alert("Gagal menghapus beberapa item dari wishlist");
    return false;
  }
}