# Hytales Asset Editor Helper API

## Installation

```bash
npm install
```

## Downloading assets

```bash
npm run download
```

## Generating properties

```bash
npm run generate
```

## Usage

```bash
node server.js
```

## Endpoints

### /properties

Returns a list of all properties available in the game.

### /properties/:key

Returns the properties of the given key.

- properties : the sub properties available of the parent.
-> Ex : {"EntityEffect": {"DamageResistance" : { ... }} }
- array_properties : same as before but in an array
-> Ex : {"Interactions":[ {"Type" : ..."Effects": ...}] }
- primitives : are the primitive values available directly on property (string, number, boolean)
-> Ex : {"EntityEffect":"Burn"}
- array_primitives : Same as primitives but in array
-> Ex : {"DropSector":[ -360, 360  ]}

### /game/server/asset/

Returns the server asset with the given fullpath.