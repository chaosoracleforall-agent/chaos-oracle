#!/bin/bash
# Encrypts Reddit credentials to reddit_vault.enc
# All inputs are entered interactively — nothing stored in shell history

VAULT_FILE="$(dirname "$0")/reddit_vault.enc"

echo "=== Reddit Credential Encryption ==="
echo ""

read -p "Reddit Client ID: " CLIENT_ID
read -p "Reddit Refresh Token: " REFRESH_TOKEN
read -p "Reddit Username: " USERNAME
echo -n "Reddit Password: "
read -s PASSWORD
echo ""
echo ""
echo -n "Vault encryption password: "
read -s VAULT_PASS
echo ""

printf "REDDIT_CLIENT_ID=%s\nREDDIT_REFRESH_TOKEN=%s\nREDDIT_USERNAME=%s\nREDDIT_PASSWORD=%s\n" \
  "$CLIENT_ID" "$REFRESH_TOKEN" "$USERNAME" "$PASSWORD" | \
  openssl enc -aes-256-cbc -pbkdf2 -salt -pass "pass:$VAULT_PASS" -out "$VAULT_FILE"

if [ $? -eq 0 ]; then
  echo "Reddit credentials encrypted to $VAULT_FILE"
else
  echo "Encryption failed!"
  exit 1
fi

# Clear all variables
unset CLIENT_ID REFRESH_TOKEN USERNAME PASSWORD VAULT_PASS
