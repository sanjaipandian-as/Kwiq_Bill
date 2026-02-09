import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'billing_queue_items';

export const addToBillingQueue = async (product) => {
    try {
        // We store minimal info needed to add to cart
        // We can also handle quantity aggregation here if needed, but for now just a list of pushes
        const current = await getBillingQueue();
        // Add timestamp to ensure uniqueness if needed, or just push
        const updated = [...current, { ...product, _queuedAt: Date.now() }];
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
        return true;
    } catch (error) {
        console.error('Error adding to billing queue', error);
        return false;
    }
};

export const getBillingQueue = async () => {
    try {
        const stored = await AsyncStorage.getItem(QUEUE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error getting billing queue', error);
        return [];
    }
};

export const clearBillingQueue = async () => {
    try {
        await AsyncStorage.removeItem(QUEUE_KEY);
    } catch (error) {
        console.error('Error clearing billing queue', error);
    }
};
