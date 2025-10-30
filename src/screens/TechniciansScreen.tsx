import React from 'react';
import { View, Text, ScrollView } from 'react-native';

export default function Technicians() {
  return (
    <ScrollView
      className="flex-1 px-6 pb-20 bg-white"
      style={{ marginTop: -20, paddingTop: 26, borderTopLeftRadius: 15, borderTopRightRadius: 15, zIndex: 2 }}
    >
        <View className="bg-white rounded-2xl p-6 shadow-md mb-4">
          <Text className="text-xl font-bold text-slate-800 mb-2">
            No Technicians Available
          </Text>
          <Text className="text-slate-600 text-base">
            You currently have no techncians. Check back later for new techncians.
          </Text>
        </View>
      </ScrollView>
  );
}
