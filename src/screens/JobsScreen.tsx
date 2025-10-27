import React from 'react';
import { View, Text, ScrollView } from 'react-native';

export default function JobsScreen() {
  return (
    <ScrollView className="flex-1 px-6 pt-6 pb-20">
        <View className="bg-white rounded-2xl p-6 shadow-md mb-4">
          <Text className="text-xl font-bold text-slate-800 mb-2">
            No Jobs Available
          </Text>
          <Text className="text-slate-600 text-base">
            You currently have no assigned jobs. Check back later for new assignments.
          </Text>
        </View>
      </ScrollView>
  );
}
