/**
 * Pad Koi — Filtering and sorting
 * A project of ScriptySphere
 */

const PadKoiFilters = (() => {
  const defaultState = {
    query: "",
    types: [], // pharmacy, supermarket, convenience, shop, emergency, vending
    openNow: false,
    verifiedOnly: false,
    availableNow: false,
    maxDistanceMeters: null,
    sort: "nearest", // "nearest" | "name"
  };

  let state = { ...defaultState };

  function get() {
    return { ...state };
  }

  function reset() {
    state = { ...defaultState };
  }

  function set(partial) {
    state = { ...state, ...partial };
  }

  function toggleType(type) {
    if (state.types.includes(type)) {
      state.types = state.types.filter((t) => t !== type);
    } else {
      state.types = [...state.types, type];
    }
  }

  function apply(stores) {
    let results = stores;

    if (state.query && state.query.trim().length > 0) {
      const q = state.query.trim().toLowerCase();
      results = results.filter((s) => {
        const haystack = [
          s.name,
          s.address,
          s.district,
          s.type,
          ...(s.products || []),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }

    if (state.types.length > 0) {
      results = results.filter((s) => state.types.includes(s.type));
    }

    if (state.openNow) {
      results = results.filter((s) => PadKoiStores.isOpenNow(s) === true);
    }

    if (state.verifiedOnly) {
      results = results.filter((s) => s.verified === true);
    }

    if (state.availableNow) {
      results = results.filter((s) => s.availabilityStatus === "verified" || s.availabilityStatus === "community");
    }

    if (state.maxDistanceMeters && PadKoiStores.getUserLocation()) {
      results = results.filter(
        (s) => s.distanceMeters != null && s.distanceMeters <= state.maxDistanceMeters
      );
    }

    results = sortResults(results);
    return results;
  }

  function sortResults(results) {
    const sorted = [...results];
    if (state.sort === "nearest" && PadKoiStores.getUserLocation()) {
      sorted.sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity));
    } else {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  }

  return { get, set, reset, toggleType, apply };
})();
