#include <iostream>
#include <string>
#include <vector>
using namespace std;

vector<int> build_lps(const string& pattern) {
    vector<int> lps(pattern.size(), 0);
    int i = 1;
    int j = 0;
    // [start] build_lps
    while (i < static_cast<int>(pattern.size())) {
        // [start] compare_prefix
        if (pattern[i] == pattern[j]) {
            lps[i] = j + 1;
            ++i;
            ++j;
        // [end] compare_prefix
        // [start] fallback_prefix
        } else if (j > 0) {
            j = lps[j - 1];
        // [end] fallback_prefix
        } else {
            ++i;
        }
    }
    // [end] build_lps
    return lps;
}

int kmp_search(const string& text, const string& pattern) {
    if (pattern.empty()) {
        return -1;
    }
    const vector<int> lps = build_lps(pattern);
    int i = 0;
    int j = 0;
    // [start] search
    while (i < static_cast<int>(text.size())) {
        // [start] compare_text
        if (text[i] == pattern[j]) {
            ++i;
            ++j;
            if (j == static_cast<int>(pattern.size())) {
                // [start end] match_found
                return i - j;
            }
        // [end] compare_text
        // [start] fallback_text
        } else if (j > 0) {
            j = lps[j - 1];
        // [end] fallback_text
        } else {
            ++i;
        }
    }
    // [end] search
    return -1;
}

int main() {
    string text, pattern;
    getline(cin, text);
    getline(cin, pattern);
    cout << kmp_search(text, pattern) << '\n';
}
