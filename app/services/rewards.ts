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
    duration: number,
    isBuddy: boolean,
    isCompleted: boolean,
    partnerLeft: boolean = false
): RewardResult => {
    if (isCompleted) {
        if (isBuddy) {
            if (partnerLeft) {
                return {
                    points: REWARD_POINTS.PARTNER_LEFT_COMPLETION,
                    message: `Your partner left early, but you completed the session! You've earned ${REWARD_POINTS.PARTNER_LEFT_COMPLETION} coins.`,
                    type: 'partner_left'
                };
            }
            return {
                points: REWARD_POINTS.BUDDY_COMPLETION,
                message: `Congratulations! You've earned ${REWARD_POINTS.BUDDY_COMPLETION} coins for completing a buddy session!`,
                type: 'success'
            };
        }
        return {
            points: REWARD_POINTS.SOLO_COMPLETION,
            message: `Well done! You've earned ${REWARD_POINTS.SOLO_COMPLETION} coins for completing your session!`,
            type: 'success'
        };
    } else {
        const penalty = isBuddy ? REWARD_POINTS.BUDDY_QUIT_PENALTY : REWARD_POINTS.EARLY_QUIT_PENALTY;
        return {
            points: penalty,
            message: `You've lost ${Math.abs(penalty)} coins for ending the session early.`,
            type: 'penalty'
        };
    }
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