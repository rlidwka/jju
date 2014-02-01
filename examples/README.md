
These are the examples for some common use-cases.

## convert

This simple example converts JSON5 into JSON. Nothing too fancy.

## jsonlint

This example shows how to ensure that your JSON is a valid, and display an appropriate error message if it's not.

It also shows how to get line numbers for a possible error, since JSON.parse doesn't provide this information.

## strip-comments

This example removes comments from a JSON file to process it with JSON.parse later.

It is pretty much useless as is, but it shows what tokenize function can do.

## update-json

This example shows how to update your json gracefully.

You can format your JSON file as you like, and we can update it preserving it's initial formatting (newlines, spaces, etc.).

