import { View, StyleSheet, TextInput, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';

type Props = {
  query: string;
  onChangeQuery: (text: string) => void;
  onToggleFilter: () => void;
  onToggleSort: () => void;
  filterActive?: boolean;
};

export function MomentsSearchAndFilter({
  query,
  onChangeQuery,
  onToggleFilter,
  onToggleSort,
  filterActive,
}: Props) {
  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchWrap}>
        <Feather name="search" size={18} color="#94A3B8" />
        <TextInput
          style={styles.input}
          placeholder="Search by name or company..."
          placeholderTextColor="#94A3B8"
          value={query}
          onChangeText={onChangeQuery}
        />
        {query ? (
          <Pressable onPress={() => onChangeQuery('')} style={styles.clearBtn}>
            <Feather name="x-circle" size={16} color="#94A3B8" />
          </Pressable>
        ) : null}
      </View>

      {/* Filter Button */}
      <Pressable
        style={[styles.filterBtn, filterActive && styles.filterBtnActive]}
        onPress={onToggleFilter}
      >
        <Feather name="filter" size={18} color={filterActive ? '#FFFFFF' : '#111827'} />
      </Pressable>

      {/* Sort Button */}
      <Pressable style={styles.filterBtn} onPress={onToggleSort}>
        <Feather name="arrow-down" size={18} color="#111827" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 16,
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
    paddingHorizontal: 14,
    height: 46,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  clearBtn: {
    padding: 4,
  },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterBtnActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
});
