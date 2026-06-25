import { View, StyleSheet, TextInput, Pressable } from 'react-native';
import { MagnifierBoldDuotone, FilterBoldDuotone, SortByTimeBoldDuotone } from '@solar-icons/react-native';

export function MomentsSearchAndFilter() {
  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchWrap}>
        <MagnifierBoldDuotone size={20} color="#94A3B8" />
        <TextInput
          style={styles.input}
          placeholder="Search by name or company..."
          placeholderTextColor="#94A3B8"
        />
      </View>

      {/* Two filter buttons nearby */}
      <Pressable style={styles.filterBtn}>
        <FilterBoldDuotone size={22} color="#111827" />
      </Pressable>

      <Pressable style={styles.filterBtn}>
        <SortByTimeBoldDuotone size={22} color="#111827" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 48,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  filterBtn: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
});
