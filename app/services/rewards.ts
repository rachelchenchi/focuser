export const REWARD_POINTS = {
    SOLO_COMPLETION: 50,
    BUDDY_COMPLETION: 100,
    EARLY_QUIT_PENALTY: -10,
    BUDDY_QUIT_PENALTY: -20,
    PARTNER_LEFT_COMPLETION: 75,
};

export interface RewardResult {
    points: number;
    message: string;
    type: 'success' | 'penalty' | 'partner_left';
}

export const calculateReward = (
    focusTime: number,
    isBuddy: boolean,
    isCompleted: boolean,
    partnerLeft: boolean
) => {
    const baseReward = Math.floor(focusTime / 60 + 1);
    let points = baseReward;
    let message = '';
    let type = 'success';

    if (isCompleted) {
        if (isBuddy) {
            if (partnerLeft) {
                points = Math.floor(baseReward * 1.5);
                message = `Partner left but you made it! Earned ${points} coins!`;
                type = 'partner_left';
            } else {
                points = baseReward * 2;
                message = `Great teamwork! Earned ${points} coins!`;
            }
        } else {
            message = `Well done! Earned ${points} coins!`;
        }
    } else {
        points = -Math.floor(baseReward * 0.2);
        if (isBuddy) {
            points *= 2;
        }
        message = `Gave up early. Lost ${Math.abs(points)} coins.`;
        type = 'quit';
    }

    return { points, message, type };
};

export const updateUserCoins = async (token: string, amount: number): Promise<number> => {
    try {
        const response = await fetch('http://localhost:5000/api/coins/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ amount }),
        });

        if (!response.ok) {
            throw new Error('Failed to update coins');
        }

        const data = await response.json();
        return data.coins;
    } catch (error) {
        console.error('Error updating coins:', error);
        throw error;
    }
};

export const getUserCoins = async (token: string): Promise<number> => {
    try {
        const response = await fetch('http://localhost:5000/api/coins', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to get coins');
        }

        const data = await response.json();
        return data.coins;
    } catch (error) {
        console.error('Error getting coins:', error);
        throw error;
    }
}; 