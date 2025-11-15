// lib/garden.ts - Complete dengan getGardenSummary

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

export interface GardenEntry {
  id: string;
  userId: string;
  plantId: number;
  plantName: string;
  image?: string;
  plantedAt: any;
  startedAt?: any;
  lastWateredAt: any;
  wateringHistory?: string[];
}

export interface PlantHistoryEntry {
  id: string;
  userId: string;
  plantId: number;
  plantName: string;
  image?: string;
  plantedAt: any;
  stoppedAt: any;
  reason: "died" | "notSuitable";
  totalWateringDays?: number;
  wateringHistory?: string[];
}

export interface GardenWithPlant extends GardenEntry {
  plant?: any;
}

export interface GardenSummary {
  total: number;
  unwateredToday: number;
  overdue: number;
}

// Tambah tanaman ke garden
export async function addPlantToGarden({
  userId,
  plantId,
  plantName,
  image,
}: {
  userId: string;
  plantId: number;
  plantName: string;
  image?: string;
}) {
  const docRef = doc(collection(db, "garden"));
  await setDoc(docRef, {
    userId,
    plantId,
    plantName,
    image: image || null, // Handle undefined as null
    plantedAt: serverTimestamp(),
    startedAt: serverTimestamp(),
    lastWateredAt: null,
    wateringHistory: [],
  });
  return docRef.id;
}

// Get all garden entries for a user
export async function getUserGarden(userId: string): Promise<GardenEntry[]> {
  const q = query(collection(db, "garden"), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  
  const entries: GardenEntry[] = [];
  snapshot.forEach((doc) => {
    const data = doc.data();
    entries.push({
      id: doc.id,
      userId: data.userId,
      plantId: data.plantId,
      plantName: data.plantName,
      image: data.image || undefined, // Convert null to undefined
      plantedAt: data.plantedAt,
      startedAt: data.startedAt,
      lastWateredAt: data.lastWateredAt,
      wateringHistory: data.wateringHistory || [],
    });
  });
  
  return entries;
}

// Check if plant was watered today  
export function isWateredToday(entry: GardenEntry | GardenWithPlant): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return entry.wateringHistory?.includes(today) || false;
}

// Mark plant as watered today
export async function markWateredToday(entryId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const docRef = doc(db, "garden", entryId);
  
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    throw new Error("Garden entry not found");
  }
  
  const currentHistory = docSnap.data().wateringHistory || [];
  
  if (!currentHistory.includes(today)) {
    await updateDoc(docRef, {
      lastWateredAt: serverTimestamp(),
      wateringHistory: [...currentHistory, today],
    });
  }
}

// Stop planting (remove from garden)
export async function stopPlanting(entryId: string) {
  const docRef = doc(db, "garden", entryId);
  await deleteDoc(docRef);
}

// Add to plant history dengan alasan
export async function addToPlantHistory({
  entryId,
  plantName,
  reason,
  stoppedAt,
}: {
  entryId: string;
  plantName: string;
  reason: "died" | "notSuitable";
  stoppedAt: Date;
}) {
  // Get garden entry details first
  const gardenDoc = await getDoc(doc(db, "garden", entryId));
  if (!gardenDoc.exists()) {
    throw new Error("Garden entry not found");
  }
  
  const gardenData = gardenDoc.data();
  const wateringDays = gardenData.wateringHistory?.length || 0;
  
  // Save to history
  const historyRef = doc(collection(db, "plantHistory"));
  await setDoc(historyRef, {
    userId: gardenData.userId,
    plantId: gardenData.plantId,
    plantName: gardenData.plantName || plantName,
    image: gardenData.image || null,
    plantedAt: gardenData.plantedAt || gardenData.startedAt,
    stoppedAt: serverTimestamp(),
    reason,
    totalWateringDays: wateringDays,
    wateringHistory: gardenData.wateringHistory || [],
  });
  
  return historyRef.id;
}

// Get plant history for user
export async function getPlantHistory(userId: string): Promise<PlantHistoryEntry[]> {
  const q = query(collection(db, "plantHistory"), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  
  const entries: PlantHistoryEntry[] = [];
  snapshot.forEach((doc) => {
    const data = doc.data();
    entries.push({
      id: doc.id,
      userId: data.userId,
      plantId: data.plantId,
      plantName: data.plantName,
      image: data.image || undefined, // Convert null to undefined
      plantedAt: data.plantedAt,
      stoppedAt: data.stoppedAt,
      reason: data.reason,
      totalWateringDays: data.totalWateringDays,
      wateringHistory: data.wateringHistory || [],
    });
  });
  
  // Sort by stoppedAt date (newest first)
  entries.sort((a, b) => {
    const dateA = a.stoppedAt?.toDate ? a.stoppedAt.toDate() : new Date(a.stoppedAt);
    const dateB = b.stoppedAt?.toDate ? b.stoppedAt.toDate() : new Date(b.stoppedAt);
    return dateB.getTime() - dateA.getTime();
  });
  
  return entries;
}

// Clear all plant history for user
export async function clearPlantHistory(userId: string) {
  const q = query(collection(db, "plantHistory"), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  
  const batch = writeBatch(db);
  snapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
}

// GET GARDEN SUMMARY untuk notifikasi
export async function getGardenSummary(userId: string): Promise<GardenSummary> {
  const entries = await getUserGarden(userId);
  
  const today = new Date().toISOString().slice(0, 10);
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const threeDaysAgoStr = threeDaysAgo.toISOString().slice(0, 10);
  
  let unwateredToday = 0;
  let overdue = 0;
  
  entries.forEach((entry) => {
    const wateredToday = entry.wateringHistory?.includes(today) || false;
    
    if (!wateredToday) {
      unwateredToday++;
      
      // Check if overdue (not watered for 3+ days)
      const lastWatered = entry.wateringHistory?.slice(-1)[0];
      if (!lastWatered || lastWatered < threeDaysAgoStr) {
        overdue++;
      }
    }
  });
  
  return {
    total: entries.length,
    unwateredToday,
    overdue,
  };
}