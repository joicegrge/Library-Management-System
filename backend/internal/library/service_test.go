package library

import "testing"

func TestParseID(t *testing.T) {
	for _, tc := range []struct {
		input   string
		want    int64
		wantErr bool
	}{
		{"12", 12, false}, {"0", 0, true}, {"abc", 0, true}, {"-2", 0, true},
	} {
		got, err := parseID(tc.input)
		if (err != nil) != tc.wantErr {
			t.Fatalf("parseID(%q) error = %v, wantErr %v", tc.input, err, tc.wantErr)
		}
		if got != tc.want {
			t.Fatalf("parseID(%q) = %d, want %d", tc.input, got, tc.want)
		}
	}
}

func TestInitials(t *testing.T) {
	if got := initials("amelia watson"); got != "AW" {
		t.Fatalf("initials = %q, want AW", got)
	}
	if got := initials("  prince  "); got != "P" {
		t.Fatalf("single-name initials = %q, want P", got)
	}
	if got := initials(""); got != "" {
		t.Fatalf("empty-name initials = %q, want empty", got)
	}
}
